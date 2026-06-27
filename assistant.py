#!/usr/bin/env python3
"""
Customizable macOS AI assistant.

This is intentionally dependency-light for beginners:
- Uses only Python standard library for the app.
- Uses certifi automatically if it is already installed, fixing common macOS SSL issues.
- Reads GEMINI_API_KEY from .env or the current Terminal environment.
"""

from __future__ import annotations

import base64
import json
import os
import platform
import shlex
import ssl
import subprocess
import sys
import textwrap
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.json"
ENV_PATH = ROOT / ".env"

DEFAULT_CONFIG = {
    "assistant_name": "Nova",
    "provider": "gemini",
    "model": "gemini-3.1-flash-lite",
    "fallback_models": [
        "gemini-3.1-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
    ],
    "temperature": 0.7,
    "memory_file": "memory.json",
    "history_file": "history.json",
    "notes_dir": "notes",
    "screenshots_dir": "screenshots",
    "response_mode": "fast",
    "max_memory_chars": 8000,
    "max_history_messages": 12,
    "max_output_tokens": 512,
    "api_timeout_seconds": 20,
    "retry_attempts": 1,
    "allow_shell_commands": False,
}

MODE_PRESETS = {
    "fast": {
        "model": "gemini-3.1-flash-lite",
        "temperature": 0.5,
        "max_memory_chars": 8000,
        "max_history_messages": 12,
        "max_output_tokens": 512,
        "api_timeout_seconds": 20,
        "retry_attempts": 1,
    },
    "balanced": {
        "model": "gemini-3.1-flash-lite",
        "temperature": 0.7,
        "max_memory_chars": 16000,
        "max_history_messages": 24,
        "max_output_tokens": 900,
        "api_timeout_seconds": 30,
        "retry_attempts": 2,
    },
    "deep": {
        "model": "gemini-2.5-flash",
        "temperature": 0.7,
        "max_memory_chars": 30000,
        "max_history_messages": 40,
        "max_output_tokens": 1600,
        "api_timeout_seconds": 45,
        "retry_attempts": 2,
    },
}


def load_dotenv() -> None:
    if not ENV_PATH.exists():
        return

    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return DEFAULT_CONFIG.copy()

    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        user_config = json.load(file)

    config = DEFAULT_CONFIG.copy()
    config.update(user_config)
    return config


def save_config(config: dict) -> None:
    with CONFIG_PATH.open("w", encoding="utf-8") as file:
        json.dump(config, file, indent=2)


def load_json_file(path: Path, fallback):
    if not path.exists():
        return fallback
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except json.JSONDecodeError:
        broken = path.with_suffix(path.suffix + ".broken")
        path.rename(broken)
        return fallback


def save_json_file(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def memory_path(config: dict) -> Path:
    return ROOT / config["memory_file"]


def history_path(config: dict) -> Path:
    return ROOT / config["history_file"]


def notes_dir(config: dict) -> Path:
    return ROOT / config["notes_dir"]


def screenshots_dir(config: dict) -> Path:
    return ROOT / config.get("screenshots_dir", "screenshots")


def load_memory(config: dict) -> dict:
    return load_json_file(memory_path(config), {"facts": [], "notes": [], "todos": []})


def save_memory(config: dict, memory: dict) -> None:
    save_json_file(memory_path(config), memory)


def is_failed_ai_reply(text: str) -> bool:
    failure_markers = [
        "Gemini API error",
        "I could not reach the AI API",
        "temporarily busy or unavailable",
        "was not found for this API key",
        "CERTIFICATE_VERIFY_FAILED",
        "UNAVAILABLE",
    ]
    return any(marker in text for marker in failure_markers)


def clean_history(history: list[dict]) -> list[dict]:
    clean_items = []
    skip_next_user = False

    for item in history:
        role = item.get("role")
        text = item.get("text", "")
        if role == "model" and is_failed_ai_reply(text):
            if clean_items and clean_items[-1].get("role") == "user":
                clean_items.pop()
            skip_next_user = False
            continue
        if role == "user" and text == "/":
            skip_next_user = True
            continue
        if skip_next_user and role == "model":
            skip_next_user = False
            continue
        if role in {"user", "model"} and text:
            clean_items.append({"role": role, "text": text})

    return clean_items


def load_history(config: dict) -> list[dict]:
    history = load_json_file(history_path(config), [])
    return clean_history(history)


def save_history(config: dict, history: list[dict]) -> None:
    keep = max(2, int(config.get("max_history_messages", 16)))
    save_json_file(history_path(config), clean_history(history)[-keep:])


def create_ssl_context() -> ssl.SSLContext:
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def https_json(url: str, body: dict | None = None, timeout: int = 20) -> dict:
    data = None
    headers = {"Content-Type": "application/json"}
    method = "GET"

    if body is not None:
        data = json.dumps(body).encode("utf-8")
        method = "POST"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=timeout, context=create_ssl_context()) as response:
        return json.loads(response.read().decode("utf-8"))


def gemini_url(path: str, api_key: str) -> str:
    return (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"{path}?key={urllib.parse.quote(api_key)}"
    )


def trim_text(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[-max_chars:]


def build_gemini_body(
    config: dict,
    prompt: str,
    memory: dict,
    history: list[dict],
    image_path: Path | None = None,
) -> dict:
    full_memory = json.dumps(memory, ensure_ascii=True, indent=2)
    full_memory = trim_text(full_memory, int(config.get("max_memory_chars", 20000)))

    history_messages = []
    for item in history[-int(config.get("max_history_messages", 16)) :]:
        role = item.get("role")
        text = item.get("text")
        if role in {"user", "model"} and text:
            history_messages.append({"role": role, "parts": [{"text": text}]})

    system_text = (
        f"You are {config['assistant_name']}, an advanced macOS assistant for a beginner user. "
        "Answer random questions normally, like a helpful general AI assistant. "
        "Use the saved memory when it is relevant, but do not mention it unless useful. "
        "Be practical, concise, and step-by-step. "
        "If a task needs local computer control, suggest one of the available slash commands. "
        "Never ask for passwords or secrets."
    )

    user_parts = [
        {
            "text": (
                "Saved long-term memory, notes, and todos:\n"
                f"{full_memory}\n\n"
                f"Current user message: {prompt}"
            )
        }
    ]

    if image_path is not None:
        image_bytes = image_path.read_bytes()
        user_parts.append(
            {
                "inline_data": {
                    "mime_type": "image/png",
                    "data": base64.b64encode(image_bytes).decode("ascii"),
                }
            }
        )

    history_messages.append(
        {
            "role": "user",
            "parts": user_parts,
        }
    )

    return {
        "system_instruction": {"parts": [{"text": system_text}]},
        "contents": history_messages,
        "generationConfig": {
            "temperature": float(config["temperature"]),
            "maxOutputTokens": int(config.get("max_output_tokens", 1024)),
        },
    }


def configured_models(config: dict) -> list[str]:
    models = [config["model"]]
    models.extend(config.get("fallback_models", []))
    unique_models = []
    for model in models:
        if model and model not in unique_models:
            unique_models.append(model)
    return unique_models


def call_gemini_model(api_key: str, model: str, body: dict, timeout: int) -> dict:
    url = gemini_url(f"models/{model}:generateContent", api_key)
    return https_json(url, body=body, timeout=timeout)


def extract_http_details(error: urllib.error.HTTPError) -> str:
    return error.read().decode("utf-8", errors="replace")


def is_retryable_http_error(status_code: int, details: str) -> bool:
    retryable_statuses = {429, 500, 502, 503, 504}
    if status_code in retryable_statuses:
        return True
    return "UNAVAILABLE" in details.upper() or "HIGH DEMAND" in details.upper()


def extract_reply(data: dict) -> str:
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        return f"Unexpected API response:\n{json.dumps(data, indent=2)}"


def call_gemini(
    config: dict,
    prompt: str,
    memory: dict,
    history: list[dict],
    image_path: Path | None = None,
) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return offline_reply(prompt)

    body = build_gemini_body(config, prompt, memory, history, image_path=image_path)
    last_error = ""
    attempted_models = []
    retry_attempts = max(1, int(config.get("retry_attempts", 1)))
    timeout = max(5, int(config.get("api_timeout_seconds", 20)))

    for model in configured_models(config):
        attempted_models.append(model)
        for attempt in range(retry_attempts):
            try:
                data = call_gemini_model(api_key, model, body, timeout)
                reply = extract_reply(data)
                if model != config["model"]:
                    reply += f"\n\n[Used fallback model: {model}]"
                return reply
            except urllib.error.HTTPError as error:
                details = extract_http_details(error)
                last_error = explain_http_error(error.code, details, model)
                if is_retryable_http_error(error.code, details):
                    if attempt < retry_attempts - 1:
                        time.sleep(1)
                        continue
                    break
                if error.code == 404:
                    break
                return last_error
            except ssl.SSLCertVerificationError:
                return certificate_help()
            except Exception as error:
                message = str(error)
                if "CERTIFICATE_VERIFY_FAILED" in message:
                    return certificate_help()
                last_error = f"I could not reach the AI API: {message}"
                break

    if last_error:
        return (
            f"{last_error}\n\n"
            "I tried these models: " + ", ".join(attempted_models) + ". "
            "Run /models to see which models your key supports."
        )
    return "I could not get a response. Run /doctor and /models to diagnose the setup."


def explain_http_error(status_code: int, details: str, model: str) -> str:
    if status_code == 400 and "API_KEY" in details.upper():
        return "The API key looks invalid. Create a fresh key in Google AI Studio and put it in .env."
    if status_code in {401, 403}:
        return "Gemini rejected the API key or project permissions. Rotate the key and check API access in Google AI Studio."
    if status_code == 404:
        return (
            f"The model '{model}' was not found for this API key. "
            "Run /models to list available models, then use /set model MODEL_NAME."
        )
    if status_code == 429:
        return "The free API limit was reached. Wait a bit, then try again."
    if status_code in {500, 502, 503, 504}:
        return (
            f"The model '{model}' is temporarily busy or unavailable. "
            "This is usually on the provider side, not your code."
        )
    return f"Gemini API error {status_code}:\n{details}"


def certificate_help() -> str:
    return textwrap.dedent(
        """\
        Python could not verify HTTPS certificates on this Mac.

        I now try to use certifi automatically, but your Python install may still need its macOS certificate setup.
        Run this in Terminal once:

        open "/Applications/Python 3.14/Install Certificates.command"

        Then restart Terminal and run python3 assistant.py again.
        """
    ).strip()


def offline_reply(prompt: str) -> str:
    lowered = prompt.lower()
    if "help" in lowered:
        return command_help()
    if "time" in lowered:
        return f"The current time is {datetime.now().strftime('%I:%M %p')}."
    return (
        "I am running without GEMINI_API_KEY, so I can only use local commands. "
        "Create a .env file with GEMINI_API_KEY=your_key to enable AI replies."
    )


def command_help() -> str:
    return """Commands:
/help                         Show this help
/doctor                       Diagnose Python, API key, and SSL certificates
/permissions                  Show macOS permissions needed for control
/models                       List Gemini models available to your key
/mode fast                    Fast replies with a free Flash-Lite model
/mode balanced                More context with still-fast replies
/mode deep                    Slower but deeper answers
/config                       Show assistant settings
/set name Nova                Change assistant name
/set model gemini-2.5-flash   Change Gemini model
/set temperature 0.4          Change creativity level
/set max_output 512           Limit answer length for speed
/open Safari                  Open a Mac app
/quit Safari                  Quit a Mac app
/url https://example.com      Open a website
/active                       Show the frontmost app
/apps                         List visible running apps
/spotlight calculator         Search/open with Spotlight
/screenshot                   Save a screenshot
/see                          Screenshot and ask AI what is on screen
/type Hello                   Type text into the active app
/press return                 Press one key in the active app
/hotkey command space         Press a keyboard shortcut
/voice                        Listen for one spoken command
/say Hello                    Speak text using macOS voice
/copy Hello                   Copy text to clipboard
/note Buy milk                Save a note
/notes                        Show recent notes
/remember favorite color blue Save a memory fact
/forget 1                     Delete a memory fact
/todo Finish homework         Add a todo
/todos                        Show todos
/done 1                       Mark a todo complete
/memory                       Show saved memory
/memory-summary               Count saved facts, notes, todos, and chat messages
/chat                         Show recent chat history
/reset-chat                   Clear chat history
/sys                          Show Mac system info
/exit                         Quit

Anything else is sent to the AI model when GEMINI_API_KEY is set.
Tip: ask random questions without a slash, for example: why is the sky blue?"""


def open_app(app_name: str) -> str:
    if not app_name.strip():
        return "Tell me which app to open, for example: /open Safari"
    result = subprocess.run(["open", "-a", app_name], capture_output=True, text=True)
    if result.returncode == 0:
        return f"Opened {app_name}."
    return f"Could not open {app_name}: {result.stderr.strip()}"


def quit_app(app_name: str) -> str:
    if not app_name.strip():
        return "Tell me which app to quit, for example: /quit Safari"
    script = f'tell application "{app_name}" to quit'
    result = run_osascript(script)
    if result.returncode == 0:
        return f"Asked {app_name} to quit."
    return explain_mac_control_error(result.stderr.strip())


def open_url(url: str) -> str:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    result = subprocess.run(["open", url], capture_output=True, text=True)
    if result.returncode == 0:
        return f"Opened {url}."
    return f"Could not open URL: {result.stderr.strip()}"


def run_osascript(script: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["osascript", "-e", script], capture_output=True, text=True)


def explain_mac_control_error(error_text: str) -> str:
    if not error_text:
        return "The Mac command failed without details."
    lowered = error_text.lower()
    if "not allowed" in lowered or "not authorized" in lowered or "access" in lowered:
        return (
            "macOS blocked this control action. Open System Settings > Privacy & Security, "
            "then grant Terminal Accessibility, Automation, Screen Recording, or Microphone access as needed."
        )
    return f"Mac control error: {error_text}"


def active_app() -> str:
    script = 'tell application "System Events" to get name of first application process whose frontmost is true'
    result = run_osascript(script)
    if result.returncode == 0:
        return f"Active app: {result.stdout.strip()}"
    return explain_mac_control_error(result.stderr.strip())


def visible_apps() -> str:
    script = 'tell application "System Events" to get name of every application process whose background only is false'
    result = run_osascript(script)
    if result.returncode != 0:
        return explain_mac_control_error(result.stderr.strip())
    apps = [item.strip() for item in result.stdout.replace(",", "\n").splitlines() if item.strip()]
    if not apps:
        return "No visible apps found."
    return "Visible apps:\n" + "\n".join(f"- {app}" for app in apps)


def spotlight_search(query: str) -> str:
    if not query.strip():
        return "Tell me what to search, for example: /spotlight calculator"
    script = textwrap.dedent(
        f"""\
        tell application "System Events"
            key code 49 using command down
            delay 0.2
            keystroke {json.dumps(query)}
            delay 0.2
            key code 36
        end tell
        """
    )
    result = run_osascript(script)
    if result.returncode == 0:
        return f"Searched Spotlight for: {query}"
    return explain_mac_control_error(result.stderr.strip())


def take_screenshot(config: dict) -> Path:
    folder = screenshots_dir(config)
    folder.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    path = folder / f"screen_{timestamp}.png"
    result = subprocess.run(["screencapture", "-x", str(path)], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(explain_mac_control_error(result.stderr.strip()))
    return path


def screenshot_command(config: dict) -> str:
    try:
        path = take_screenshot(config)
    except RuntimeError as error:
        return str(error)
    return f"Saved screenshot: {path}"


def see_screen(config: dict, memory: dict, history: list[dict], question: str = "") -> str:
    if not os.environ.get("GEMINI_API_KEY"):
        return "Screen understanding needs GEMINI_API_KEY because the screenshot is sent to the AI model."
    try:
        path = take_screenshot(config)
    except RuntimeError as error:
        return str(error)

    prompt = question.strip() or "Describe what is visible on my Mac screen and suggest helpful next actions."
    reply = call_gemini(config, prompt, memory, history, image_path=path)
    return f"{reply}\n\n[Screenshot: {path.name}]"


KEY_CODES = {
    "return": 36,
    "enter": 36,
    "tab": 48,
    "space": 49,
    "delete": 51,
    "backspace": 51,
    "escape": 53,
    "esc": 53,
    "left": 123,
    "right": 124,
    "down": 125,
    "up": 126,
}


MODIFIER_NAMES = {"command", "cmd", "shift", "option", "alt", "control", "ctrl"}


def type_text(text: str) -> str:
    if not text:
        return "Give me text to type, for example: /type Hello"
    script = f'tell application "System Events" to keystroke {json.dumps(text)}'
    result = run_osascript(script)
    if result.returncode == 0:
        return "Typed text into the active app."
    return explain_mac_control_error(result.stderr.strip())


def press_key(key: str) -> str:
    key = key.lower().strip()
    if not key:
        return "Give me a key, for example: /press return"
    if key in KEY_CODES:
        script = f'tell application "System Events" to key code {KEY_CODES[key]}'
    elif len(key) == 1:
        script = f'tell application "System Events" to keystroke {json.dumps(key)}'
    else:
        return "Unknown key. Try return, tab, space, escape, left, right, up, down, or one letter."
    result = run_osascript(script)
    if result.returncode == 0:
        return f"Pressed {key}."
    return explain_mac_control_error(result.stderr.strip())


def hotkey(keys_text: str) -> str:
    parts = [part.lower() for part in shlex.split(keys_text)]
    if len(parts) < 2:
        return "Use /hotkey with modifiers and a key, for example: /hotkey command space"

    modifiers = []
    main_key = None
    for part in parts:
        normalized = {"cmd": "command", "ctrl": "control", "alt": "option"}.get(part, part)
        if normalized in MODIFIER_NAMES:
            modifiers.append(normalized)
        else:
            main_key = normalized

    if not modifiers or main_key is None:
        return "Use /hotkey with modifiers and a key, for example: /hotkey command space"

    modifier_text = " using {" + " down, ".join(modifiers) + " down}"
    if main_key in KEY_CODES:
        script = f'tell application "System Events" to key code {KEY_CODES[main_key]}{modifier_text}'
    elif len(main_key) == 1:
        script = f'tell application "System Events" to keystroke {json.dumps(main_key)}{modifier_text}'
    else:
        return "Unknown hotkey key. Try letters or keys like space, tab, return, escape."

    result = run_osascript(script)
    if result.returncode == 0:
        return f"Pressed hotkey: {keys_text}"
    return explain_mac_control_error(result.stderr.strip())


VOICE_COMMANDS = [
    "open safari",
    "open chrome",
    "open notes",
    "open calculator",
    "take screenshot",
    "what is on my screen",
    "show active app",
    "list apps",
    "stop",
]


def listen_for_voice_command() -> str:
    choices = "{" + ", ".join(json.dumps(command) for command in VOICE_COMMANDS) + "}"
    script = textwrap.dedent(
        f"""\
        tell application "SpeechRecognitionServer"
            listen for {choices} with prompt "ByteOS is listening"
        end tell
        """
    )
    result = run_osascript(script)
    if result.returncode != 0:
        return ""
    return result.stdout.strip().lower()


def voice_once(config: dict, memory: dict, history: list[dict]) -> str:
    command = listen_for_voice_command()
    if not command:
        return (
            "Voice command did not work. In System Settings > Privacy & Security, grant Terminal Microphone "
            "and Accessibility access. If your Mac does not support SpeechRecognitionServer, use typed commands for now."
        )
    if command == "stop":
        return "Voice command stopped."
    routed = route_plain_mac_command(command, config, memory, history)
    return routed or f"I heard '{command}', but I do not have a local action for it yet."


def speak(text: str) -> str:
    if not text:
        return "Give me text to speak, for example: /say Hello"
    subprocess.run(["say", text], capture_output=True, text=True)
    return "Spoken."


def copy_to_clipboard(text: str) -> str:
    if not text:
        return "Give me text to copy, for example: /copy Hello"
    subprocess.run(["pbcopy"], input=text, text=True, capture_output=True)
    return "Copied to clipboard."


def system_info() -> str:
    return (
        f"macOS: {platform.mac_ver()[0] or 'unknown'}\n"
        f"Machine: {platform.machine()}\n"
        f"Python: {platform.python_version()}\n"
        f"Executable: {sys.executable}"
    )


def mac_permissions_help() -> str:
    return textwrap.dedent(
        """\
        To let ByteOS control your Mac, open System Settings > Privacy & Security and grant Terminal:

        - Accessibility: type, press keys, use shortcuts, control apps
        - Screen Recording: take screenshots and use /see
        - Microphone: voice commands
        - Automation: allow Terminal to control System Events and apps

        Restart Terminal after changing permissions.
        """
    ).strip()


def doctor(config: dict) -> str:
    verify_paths = ssl.get_default_verify_paths()
    api_key = os.environ.get("GEMINI_API_KEY")
    lines = [
        "Doctor report:",
        f"- Assistant: {config['assistant_name']}",
        f"- Model: {config['model']}",
        f"- GEMINI_API_KEY loaded: {'yes' if api_key else 'no'}",
        f"- Python: {platform.python_version()}",
        f"- macOS: {platform.mac_ver()[0] or 'unknown'}",
        f"- OpenSSL cafile exists: {Path(verify_paths.openssl_cafile).exists() if verify_paths.openssl_cafile else False}",
        f"- Mac control permissions: run /permissions to set Accessibility, Screen Recording, Microphone, Automation",
    ]

    try:
        import certifi  # type: ignore

        lines.append(f"- certifi available: yes ({certifi.where()})")
    except Exception:
        lines.append("- certifi available: no")

    if not Path("/Applications/Python 3.14/Install Certificates.command").exists():
        lines.append("- Python certificate installer: not found for Python 3.14")
    else:
        lines.append('- Python certificate installer: open "/Applications/Python 3.14/Install Certificates.command"')

    return "\n".join(lines)


def list_models() -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "GEMINI_API_KEY is not loaded. Put it in .env, then restart the assistant."
    try:
        data = https_json(gemini_url("models", api_key), timeout=30)
    except Exception as error:
        if "CERTIFICATE_VERIFY_FAILED" in str(error):
            return certificate_help()
        return f"Could not list models: {error}"

    names = []
    for model in data.get("models", []):
        methods = model.get("supportedGenerationMethods", [])
        if "generateContent" in methods:
            names.append(model["name"].removeprefix("models/"))

    if not names:
        return "No text generation models were returned for this key."
    return "Available text models:\n" + "\n".join(f"- {name}" for name in names[:30])


def write_markdown_note(config: dict, note: str) -> Path:
    folder = notes_dir(config)
    folder.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    path = folder / f"note_{timestamp}.md"
    path.write_text(f"# Note {timestamp}\n\n{note}\n", encoding="utf-8")
    return path


def show_notes(memory: dict) -> str:
    notes = memory.get("notes", [])[-10:]
    if not notes:
        return "No notes yet."
    return "\n".join(f"{index + 1}. {item['text']}" for index, item in enumerate(notes))


def show_todos(memory: dict) -> str:
    todos = memory.get("todos", [])
    if not todos:
        return "No todos yet."
    lines = []
    for index, item in enumerate(todos, start=1):
        status = "x" if item.get("done") else " "
        lines.append(f"{index}. [{status}] {item['text']}")
    return "\n".join(lines)


def memory_summary(memory: dict, history: list[dict]) -> str:
    facts = len(memory.get("facts", []))
    notes = len(memory.get("notes", []))
    todos = len(memory.get("todos", []))
    open_todos = len([item for item in memory.get("todos", []) if not item.get("done")])
    return (
        "Memory summary:\n"
        f"- Facts: {facts}\n"
        f"- Notes: {notes}\n"
        f"- Todos: {todos} ({open_todos} open)\n"
        f"- Chat messages: {len(history)}"
    )


def apply_mode(config: dict, mode: str) -> str:
    mode = mode.lower().strip()
    if mode not in MODE_PRESETS:
        return "Use /mode fast, /mode balanced, or /mode deep."

    config.update(MODE_PRESETS[mode])
    config["response_mode"] = mode
    save_config(config)
    return (
        f"Switched to {mode} mode.\n"
        f"- Model: {config['model']}\n"
        f"- Max output tokens: {config['max_output_tokens']}\n"
        f"- History messages: {config['max_history_messages']}\n"
        f"- Memory chars: {config['max_memory_chars']}"
    )


def handle_set_command(user_input: str, config: dict) -> str:
    parts = shlex.split(user_input)
    if len(parts) < 3:
        return "Use /set name Nova, /set model MODEL_NAME, or /set temperature 0.4"

    field = parts[1].lower()
    value = " ".join(parts[2:])
    if field == "name":
        config["assistant_name"] = value
    elif field == "model":
        config["model"] = value
    elif field == "temperature":
        try:
            config["temperature"] = float(value)
        except ValueError:
            return "Temperature must be a number, for example: /set temperature 0.4"
    elif field == "max_history":
        try:
            config["max_history_messages"] = int(value)
        except ValueError:
            return "Max history must be a number, for example: /set max_history 30"
    elif field == "max_output":
        try:
            config["max_output_tokens"] = int(value)
        except ValueError:
            return "Max output must be a number, for example: /set max_output 512"
    elif field == "memory_chars":
        try:
            config["max_memory_chars"] = int(value)
        except ValueError:
            return "Memory chars must be a number, for example: /set memory_chars 8000"
    elif field == "timeout":
        try:
            config["api_timeout_seconds"] = int(value)
        except ValueError:
            return "Timeout must be a number, for example: /set timeout 20"
    else:
        return "I can set name, model, temperature, max_history, max_output, memory_chars, or timeout."

    save_config(config)
    return f"Updated {field}."


def route_plain_mac_command(
    user_input: str,
    config: dict,
    memory: dict,
    history: list[dict],
) -> str | None:
    lowered = user_input.lower().strip()

    if lowered.startswith("open "):
        return open_app(user_input[5:].strip())
    if lowered.startswith("quit "):
        return quit_app(user_input[5:].strip())
    if lowered.startswith("type "):
        return type_text(user_input[5:].strip())
    if lowered.startswith("say "):
        return speak(user_input[4:].strip())
    if lowered.startswith("copy "):
        return copy_to_clipboard(user_input[5:].strip())
    if lowered.startswith("search spotlight "):
        return spotlight_search(user_input[len("search spotlight ") :].strip())
    if lowered in {"take screenshot", "screenshot"}:
        return screenshot_command(config)
    if lowered in {"what is on my screen", "see screen", "look at screen", "describe screen"}:
        return see_screen(config, memory, history)
    if lowered in {"show active app", "active app"}:
        return active_app()
    if lowered in {"list apps", "show apps"}:
        return visible_apps()
    return None


def handle_command(user_input: str, config: dict, memory: dict, history: list[dict]) -> str | None:
    if user_input in {"/exit", "/quit"}:
        print("Goodbye.")
        raise SystemExit(0)

    if user_input == "/help":
        return command_help()
    if user_input == "/doctor":
        return doctor(config)
    if user_input == "/permissions":
        return mac_permissions_help()
    if user_input == "/models":
        return list_models()
    if user_input.startswith("/mode "):
        return apply_mode(config, user_input.removeprefix("/mode ").strip())
    if user_input == "/config":
        safe_config = {key: value for key, value in config.items() if "key" not in key.lower()}
        return json.dumps(safe_config, indent=2)
    if user_input.startswith("/set "):
        return handle_set_command(user_input, config)
    if user_input.startswith("/open "):
        return open_app(user_input.removeprefix("/open ").strip())
    if user_input.startswith("/quit "):
        return quit_app(user_input.removeprefix("/quit ").strip())
    if user_input.startswith("/url "):
        return open_url(user_input.removeprefix("/url ").strip())
    if user_input == "/active":
        return active_app()
    if user_input == "/apps":
        return visible_apps()
    if user_input.startswith("/spotlight "):
        return spotlight_search(user_input.removeprefix("/spotlight ").strip())
    if user_input == "/screenshot":
        return screenshot_command(config)
    if user_input == "/see":
        return see_screen(config, memory, history)
    if user_input.startswith("/see "):
        return see_screen(config, memory, history, user_input.removeprefix("/see ").strip())
    if user_input.startswith("/type "):
        return type_text(user_input.removeprefix("/type ").strip())
    if user_input.startswith("/press "):
        return press_key(user_input.removeprefix("/press ").strip())
    if user_input.startswith("/hotkey "):
        return hotkey(user_input.removeprefix("/hotkey ").strip())
    if user_input == "/voice":
        return voice_once(config, memory, history)
    if user_input.startswith("/say "):
        return speak(user_input.removeprefix("/say ").strip())
    if user_input.startswith("/copy "):
        return copy_to_clipboard(user_input.removeprefix("/copy ").strip())
    if user_input.startswith("/note "):
        note = user_input.removeprefix("/note ").strip()
        memory.setdefault("notes", []).append(
            {"text": note, "created_at": datetime.now().isoformat(timespec="seconds")}
        )
        path = write_markdown_note(config, note)
        save_memory(config, memory)
        return f"Saved note to {path.name}."
    if user_input == "/notes":
        return show_notes(memory)
    if user_input.startswith("/remember "):
        fact = user_input.removeprefix("/remember ").strip()
        memory.setdefault("facts", []).append(fact)
        save_memory(config, memory)
        return "I will remember that."
    if user_input.startswith("/forget "):
        try:
            index = int(user_input.removeprefix("/forget ").strip()) - 1
            removed = memory.get("facts", []).pop(index)
            save_memory(config, memory)
            return f"Forgot: {removed}"
        except Exception:
            return "Use /forget with a memory fact number, for example: /forget 1"
    if user_input.startswith("/todo "):
        task = user_input.removeprefix("/todo ").strip()
        memory.setdefault("todos", []).append({"text": task, "done": False})
        save_memory(config, memory)
        return "Todo added."
    if user_input == "/todos":
        return show_todos(memory)
    if user_input.startswith("/done "):
        try:
            index = int(user_input.removeprefix("/done ").strip()) - 1
            memory["todos"][index]["done"] = True
            save_memory(config, memory)
            return "Todo marked done."
        except Exception:
            return "Use /done with a todo number, for example: /done 1"
    if user_input == "/memory":
        return json.dumps(memory, indent=2)
    if user_input == "/memory-summary":
        return memory_summary(memory, history)
    if user_input == "/chat":
        if not history:
            return "No chat history yet."
        return "\n".join(f"{item['role']}: {item['text']}" for item in history[-10:])
    if user_input == "/reset-chat":
        history.clear()
        save_history(config, history)
        return "Chat history cleared."
    if user_input == "/sys":
        return system_info()

    if user_input.startswith("/") and len(user_input) > 1:
        return None
    if user_input == "/":
        return "Ask a question without the slash, or type /help for commands."

    return None


def main() -> None:
    load_dotenv()
    config = load_config()
    memory = load_memory(config)
    history = load_history(config)
    name = config["assistant_name"]

    print(f"{name} is ready. Type /help for commands, /doctor for setup checks, /exit to quit.")
    if not os.environ.get("GEMINI_API_KEY"):
        print("No GEMINI_API_KEY found. Add it to .env for AI replies.")

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye.")
            break

        if not user_input:
            continue

        command_reply = handle_command(user_input, config, memory, history)
        if command_reply is not None:
            print(f"\n{config['assistant_name']}: {command_reply}")
            continue

        routed_reply = route_plain_mac_command(user_input, config, memory, history)
        if routed_reply is not None:
            print(f"\n{config['assistant_name']}: {routed_reply}")
            continue

        ai_prompt = user_input
        if user_input.startswith("/") and len(user_input) > 1:
            ai_prompt = user_input[1:].strip()

        reply = call_gemini(config, ai_prompt, memory, history)
        print(f"\n{config['assistant_name']}: {reply}")

        if is_failed_ai_reply(reply):
            continue

        history.append({"role": "user", "text": ai_prompt})
        history.append({"role": "model", "text": reply})
        save_history(config, history)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
