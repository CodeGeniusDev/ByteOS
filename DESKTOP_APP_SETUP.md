# ByteOS Desktop App Setup

ByteOS now has an Electron desktop shell with a Next.js + TypeScript + Tailwind AI Workbench UI. After setup, you can launch it like a normal Mac app.

## Folder Structure

```text
Mac-Assistant/
  assistant.py                         Terminal version, still available
  config.json                          Shared app settings
  memory.json                          Shared memory, notes, todos
  history.json                         Shared chat history
  automations.json                     Desktop app automations
  package.json                         Electron scripts and packaging config
  electron/
    main.js                            Desktop backend, Mac controls, AI calls
    preload.js                         Secure bridge between UI and backend
  ui/
    app/                               Next.js app router
    components/                        Reusable React workbench components
    lib/                               Hooks and utilities
    types/                             Shared TypeScript types
    tailwind.config.js                 Tailwind design system
  build/
    icon.icns                          Generated macOS app icon
  scripts/
    generate_app_icon.py               Repeatable app icon generator
```

## First Setup

Run these once:

```bash
cd /Users/abdullahabad/AbdullahAbbad-Portfolio/Mac-Assistant
npm install
```

If `npm install` is slow, wait. Electron downloads a desktop runtime.

## Start the App During Development

```bash
npm run dev
```

This opens the ByteOS desktop window and starts the Next.js UI automatically.

## Build a Normal macOS App

```bash
npm run icon
npm run dist
```

This first builds the Next.js UI, then packages Electron. After it finishes, open:

```text
dist/
```

You should see a `.dmg`, `.zip`, or `.app` build. Move ByteOS to Applications if you want.

For a fast local package check without installer files:

```bash
npm run pack
```

## Daily Use After Setup

Best path:

1. Build once with `npm run dist`.
2. Open ByteOS from `dist/` or Applications.
3. Use the UI only.

You should not need to run terminal commands every time after packaging.

## Where App Data Is Stored

During development, ByteOS reads and writes local files in this project folder:

```text
config.json
memory.json
history.json
automations.json
screenshots/
```

In the packaged app, ByteOS stores runtime data in the normal Electron/macOS user data folder, so it does not try to write inside the read-only app bundle.

## App Features

Dashboard:

- Start voice input.
- Trigger common Mac actions.
- See activity and status.

Chat:

- Ask normal AI questions.
- Give natural commands like `open Safari` or `take screenshot`.

Mac Control:

- Open or quit apps.
- Open websites.
- Type into the active app.
- Use Spotlight.
- Screenshot and screen understanding.

Automations:

- Add simple local automations.
- Start or stop automations.
- Remove automations.

Memory:

- Add facts.
- Manage todos.

Settings:

- Save API key locally.
- Change model.
- Switch fast, balanced, and deep modes.
- Open macOS Privacy settings.

## Required macOS Permissions

Open:

```text
System Settings > Privacy & Security
```

Grant ByteOS, Electron, or Terminal these permissions when macOS asks:

- Accessibility
- Screen Recording
- Microphone
- Automation

Restart the app after changing permissions.

## Troubleshooting

If the app does not open:

```bash
npm run dev
```

If dependencies are missing:

```bash
npm install
```

If Mac controls fail, open Settings in the app and grant permissions.

If AI replies fail, save your Gemini API key in the Settings panel.

## Code Signing

The local packaged app works unsigned, but macOS may show warnings on first launch. To distribute ByteOS professionally, you need an Apple Developer ID certificate and notarization.
