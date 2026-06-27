# Step-by-Step Guide: Mac AI Assistant From Zero to Advanced

This guide takes you from no coding knowledge to a customizable Mac assistant.

## Level 0: Understand the Idea

An AI assistant has four basic parts:

1. Input: what you type or say.
2. Brain: the AI model that writes the answer.
3. Memory: saved facts, notes, todos, and chat history.
4. Tools: actions like opening apps, websites, notes, clipboard, and voice.

ByteOS already has all four in a beginner-friendly terminal app.

## Level 1: Run the Assistant

1. Open Terminal.
2. Go to the project folder:

```bash
cd /Users/abdullahabad/AbdullahAbbad-Portfolio/Mac-Assistant
```

3. Run ByteOS:

```bash
python3 assistant.py
```

4. Try:

```text
hi
Why is the sky blue?
/help
/doctor
```

Use normal text for AI questions. Use `/commands` only for local Mac actions.

## Level 2: Use a Free Fast AI Model

ByteOS is configured for fast free replies with:

```text
gemini-3.1-flash-lite
```

Fast mode uses:

- Shorter answers.
- Less chat history.
- Less memory context.
- A faster API timeout.
- Flash-Lite model first, then fallback models if it is busy.

Inside ByteOS, use:

```text
/mode fast
```

For deeper answers:

```text
/mode balanced
/mode deep
```

## Level 3: Add Personal Memory

Teach ByteOS facts about you:

```text
/remember my name is Abdullah
/remember I am learning Python from zero
/remember I want to build a Mac AI assistant
```

Check memory:

```text
/memory
/memory-summary
```

Remove a wrong memory:

```text
/forget 1
```

## Level 4: Notes and Todos

Save notes:

```text
/note Today I learned how API keys work
/notes
```

Create todos:

```text
/todo learn Python variables
/todo add voice input to ByteOS
/todos
/done 1
```

## Level 5: Mac Actions

Open apps:

```text
/open Safari
/open Notes
/open Calculator
```

Open websites:

```text
/url google.com
/url https://ai.google.dev
```

Use voice and clipboard:

```text
/say Hello, I am ByteOS
/copy This text is now on my clipboard
```

## Level 6: Make Replies Faster

Use these settings:

```text
/mode fast
/set max_output 300
/set memory_chars 5000
/set max_history 8
/set timeout 15
```

Speed tradeoff:

- Lower `max_output` means shorter, faster replies.
- Lower `memory_chars` means less memory included.
- Lower `max_history` means less old conversation included.
- Lower `timeout` fails faster when the network is slow.

## Level 7: Make Replies Smarter

Use:

```text
/mode balanced
```

or:

```text
/mode deep
```

Deep mode sends more memory and chat history, so answers can be smarter but slower.

## Level 8: Learn the Code

Study these parts of `assistant.py`:

1. `load_dotenv`: reads your API key from `.env`.
2. `load_config`: reads assistant settings.
3. `build_gemini_body`: prepares the AI prompt.
4. `call_gemini`: sends the request to Gemini.
5. `handle_command`: handles slash commands.
6. `save_memory`: stores notes, facts, and todos.

Change one small thing at a time, then test:

```bash
python3 -m py_compile assistant.py
python3 assistant.py
```

## Level 9: Add Voice Input

Next advanced feature:

1. Record microphone audio.
2. Convert speech to text.
3. Send the text to ByteOS.
4. Speak the answer back with macOS `say`.

Good beginner path:

- Start with keyboard input.
- Add text-to-speech first.
- Add speech-to-text later.

## Level 10: Add a Menu Bar App

After the terminal app feels good, create a Mac menu bar version:

1. Keep `assistant.py` as the brain.
2. Build a small GUI.
3. Add a text box for questions.
4. Add buttons for common commands.
5. Show memory and todos in panels.

## Level 11: Add Tool Plugins

Create separate tools for:

- Files search.
- Calendar.
- Reminders.
- Email drafts.
- Browser opening.
- Code helper.
- Study helper.

Keep every powerful tool safe. Ask before deleting files, sending messages, or running shell commands.

## Level 12: Local Private AI

For privacy, later add Ollama:

1. Install Ollama.
2. Download a local model.
3. Add a second provider in config.
4. Use Gemini for speed and Ollama for private/offline tasks.

## Suggested Learning Plan

Week 1:

- Run ByteOS.
- Learn Terminal basics.
- Learn Python variables, strings, lists, and dictionaries.

Week 2:

- Understand JSON config.
- Add new slash commands.
- Practice reading and writing files.

Week 3:

- Learn APIs.
- Understand API keys.
- Improve memory and notes.

Week 4:

- Add voice output/input.
- Add menu bar app planning.
- Add safe tools.

Advanced goal:

Build ByteOS into your personal Mac command center: chat, memory, notes, todos, voice, app control, web opening, and private local model support.
