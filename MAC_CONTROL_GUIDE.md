# ByteOS Mac Control Guide

ByteOS can become a real Mac assistant, but macOS will not allow full control until you grant permissions.

## What ByteOS Can Control Now

Local Mac commands:

```text
/open Safari
/quit Safari
/active
/apps
/spotlight calculator
/screenshot
/see
/type Hello
/press return
/hotkey command space
/say Hello
/copy Hello
/voice
```

Natural typed commands also work:

```text
open Safari
quit Notes
take screenshot
what is on my screen
show active app
list apps
type hello
say hello
copy this text
```

## Required macOS Permissions

Open:

```text
System Settings > Privacy & Security
```

Grant Terminal these permissions:

1. Accessibility
   - Needed for typing, pressing keys, hotkeys, Spotlight, and app control.
2. Screen Recording
   - Needed for `/screenshot` and `/see`.
3. Microphone
   - Needed for `/voice`.
4. Automation
   - Needed when Terminal controls System Events or other apps.

Restart Terminal after changing permissions.

Inside ByteOS, run:

```text
/permissions
/doctor
```

## Voice Control

Run:

```text
/voice
```

ByteOS listens for one of these commands:

```text
open safari
open chrome
open notes
open calculator
take screenshot
what is on my screen
show active app
list apps
stop
```

This uses macOS speech recognition. If your Mac blocks it, grant Microphone and Accessibility permissions.

## Screen Understanding

Run:

```text
/see
```

ByteOS will:

1. Take a screenshot.
2. Send the screenshot to the AI model.
3. Ask the model to describe what is visible.
4. Suggest next actions.

You can ask a specific question:

```text
/see what app is open and what should I click next?
```

Screenshots are stored in:

```text
screenshots/
```

## Safety Rules

ByteOS should ask before doing dangerous things, such as:

- Deleting files.
- Sending emails/messages.
- Making purchases.
- Running unknown shell commands.
- Changing system settings.
- Uploading private files.

Full Mac control is powerful. Build it in layers.

## Advanced Roadmap

Level 1:

- Open apps.
- Open websites.
- Speak text.
- Copy text.

Level 2:

- Type into active apps.
- Press keys and hotkeys.
- Use Spotlight.
- Quit apps.

Level 3:

- Screenshot the screen.
- Ask AI what is visible.
- Suggest next action.

Level 4:

- Voice command loop.
- Wake word.
- Text-to-speech replies.

Level 5:

- App-specific skills:
  - Safari control.
  - Notes control.
  - Calendar control.
  - Finder file search.
  - VS Code helper.

Level 6:

- Local AI model with Ollama for private offline control.

Level 7:

- Menu bar app with buttons, microphone, memory, and action logs.
