# Mac Assistant

A beginner-friendly but customizable AI assistant for macOS.

ByteOS now has both:

- A desktop AI Workbench app built with Electron, Next.js, TypeScript, and Tailwind CSS.
- The older terminal assistant in `assistant.py`.

## What it can do

- Run as a desktop macOS app with dashboard, chat, controls, settings, activity, memory, and automations.
- Chat with a fast free Gemini Flash-Lite model.
- Run without an API key in limited offline mode.
- Open Mac apps.
- Open websites.
- Control the active app with typing, keys, hotkeys, Spotlight, and screenshots.
- Use one-shot voice commands through macOS speech recognition.
- Ask the AI what is visible on your screen with `/see`.
- Speak text with the macOS `say` voice.
- Copy text to the clipboard.
- Save notes, todos, memory facts, and chat history.
- Show simple system information.
- Let you customize the assistant name, model, temperature, memory file, and history file.
- Switch response speed with `/mode fast`, `/mode balanced`, and `/mode deep`.

## Step 1: Check Python

For the desktop app setup, read [DESKTOP_APP_SETUP.md](DESKTOP_APP_SETUP.md).

Quick desktop commands:

```bash
npm run dev
npm run build:web
npm run pack
```

## Terminal Version

The terminal version still works and is useful for testing.

### Step 1: Check Python

Open Terminal in this folder and run:

```bash
python3 --version
```

If it prints a version like `Python 3.11` or newer, you are ready.

## Step 2: Create your config

```bash
cp config.example.json config.json
```

Edit `config.json` if you want to rename the assistant.

## Step 3: Add your free API key safely

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create an API key.
3. Create a `.env` file:

```bash
cp .env.example .env
```

4. Open `.env` and replace `paste-your-key-here` with your Gemini API key.

Do not paste your API key into GitHub, screenshots, or public chat. If your key was exposed, rotate it in Google AI Studio.

## Step 4: Run the assistant

```bash
python3 assistant.py
```

Try:

```text
/help
/doctor
/permissions
/mode fast
/open Safari
/active
/screenshot
/see
/voice
/url apple.com
/say Hello Abdullah
/copy Save this text
/remember my favorite editor is VS Code
/todo Finish the Mac assistant
/memory
Plan my day in a simple checklist
```

Ask normal/random questions without a slash:

```text
Why is the sky blue?
Give me 5 business ideas
Explain Python like I am a beginner
```

If one Gemini model is busy, ByteOS automatically tries the fallback models listed in `config.json`.

## Fast free model setup

ByteOS defaults to `gemini-3.1-flash-lite`, with fast settings:

- `max_output_tokens`: 512
- `max_history_messages`: 12
- `max_memory_chars`: 8000
- `api_timeout_seconds`: 20

Use these commands inside ByteOS:

```text
/mode fast
/mode balanced
/mode deep
```

Fast mode is best for normal questions. Deep mode is slower but better for complex planning, long explanations, and using more memory.

## Fix the SSL certificate error

If you see:

```text
CERTIFICATE_VERIFY_FAILED
```

run this once:

```bash
open "/Applications/Python 3.14/Install Certificates.command"
```

Then close Terminal, open it again, and run:

```bash
python3 assistant.py
```

The assistant also tries to use the installed `certifi` certificate bundle automatically.

## Free API note

This project starts with Gemini because Google's official Gemini API pricing page lists a free tier for developers and small projects. Free tiers can change, and free-tier prompts may be used to improve products, so do not send private passwords, secrets, bank details, or sensitive documents.

## Roadmap

For the full learning plan, read [STEP_BY_STEP_AI_ASSISTANT_GUIDE.md](STEP_BY_STEP_AI_ASSISTANT_GUIDE.md).

For Mac control, voice, screenshots, and permissions, read [MAC_CONTROL_GUIDE.md](MAC_CONTROL_GUIDE.md).

Short path:

1. Terminal assistant with text chat.
2. Add safe Mac actions such as opening apps, websites, notes, todos, voice, and clipboard.
3. Add voice input and text-to-speech.
4. Add a small menu-bar app.
5. Add plugins for custom commands.
6. Add local AI support with Ollama for fully private offline use.

## Troubleshooting

If AI replies say the API key is missing, run:

```bash
echo $GEMINI_API_KEY
```

If it prints nothing, make sure `.env` exists and contains:

```text
GEMINI_API_KEY=your-key-here
```

Run setup diagnostics:

```text
/doctor
```

If you see a `503` or `high demand` message, Gemini is temporarily overloaded. ByteOS will retry and try fallback models automatically, but sometimes all free models may be busy for a short time.
