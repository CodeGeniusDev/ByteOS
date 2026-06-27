const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execFile, spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_ROOT = app.isPackaged ? app.getPath("userData") : ROOT;
const CONFIG_PATH = path.join(DATA_ROOT, "config.json");
const MEMORY_PATH = path.join(DATA_ROOT, "memory.json");
const HISTORY_PATH = path.join(DATA_ROOT, "history.json");
const AUTOMATIONS_PATH = path.join(DATA_ROOT, "automations.json");
const SCREENSHOTS_DIR = path.join(DATA_ROOT, "screenshots");
const FILES_DIR = path.join(DATA_ROOT, "files");
const LOGS_PATH = path.join(DATA_ROOT, "logs.json");

const DEFAULT_CONFIG = {
  assistant_name: "ByteOS",
  provider: "gemini",
  model: "gemini-3.1-flash-lite",
  fallback_models: [
    "gemini-3.1-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash"
  ],
  temperature: 0.5,
  response_mode: "fast",
  max_memory_chars: 8000,
  max_history_messages: 12,
  max_output_tokens: 512,
  api_timeout_seconds: 20,
  retry_attempts: 1,
  allow_shell_commands: false
};

const MODE_PRESETS = {
  fast: {
    model: "gemini-3.1-flash-lite",
    temperature: 0.5,
    max_memory_chars: 8000,
    max_history_messages: 12,
    max_output_tokens: 512,
    api_timeout_seconds: 20,
    retry_attempts: 1
  },
  balanced: {
    model: "gemini-3.1-flash-lite",
    temperature: 0.7,
    max_memory_chars: 16000,
    max_history_messages: 24,
    max_output_tokens: 900,
    api_timeout_seconds: 30,
    retry_attempts: 2
  },
  deep: {
    model: "gemini-2.5-flash",
    temperature: 0.7,
    max_memory_chars: 30000,
    max_history_messages: 40,
    max_output_tokens: 1600,
    api_timeout_seconds: 45,
    retry_attempts: 2
  }
};

let mainWindow;
let nextDevProcess;
const automationTimers = new Map();

function ensureJson(filePath, fallback) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readConfig() {
  return { ...DEFAULT_CONFIG, ...ensureJson(CONFIG_PATH, DEFAULT_CONFIG) };
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function readMemory() {
  return ensureJson(MEMORY_PATH, { facts: [], notes: [], todos: [] });
}

function writeMemory(memory) {
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

function readHistory() {
  return ensureJson(HISTORY_PATH, []);
}

function writeHistory(history, config = readConfig()) {
  const keep = Math.max(2, Number(config.max_history_messages || 12));
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history.slice(-keep), null, 2));
}

function saveChatTurn(userText, assistantText) {
  const config = readConfig();
  const history = readHistory();
  history.push({ role: "user", text: userText });
  history.push({ role: "model", text: assistantText });
  writeHistory(history, config);
}

function readAutomations() {
  return ensureJson(AUTOMATIONS_PATH, []);
}

function writeAutomations(automations) {
  fs.writeFileSync(AUTOMATIONS_PATH, JSON.stringify(automations, null, 2));
}

function readLogs() {
  return ensureJson(LOGS_PATH, []);
}

function writeLogs(logs) {
  fs.writeFileSync(LOGS_PATH, JSON.stringify(logs.slice(0, 300), null, 2));
}

function logEvent(message, level = "info") {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    level,
    at: new Date().toISOString()
  };
  writeLogs([entry, ...readLogs()]);
  return entry;
}

function fileKind(name) {
  const ext = path.extname(name).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic"].includes(ext)) return "image";
  if (ext === ".pdf") return "pdf";
  if ([".txt", ".md", ".json", ".csv", ".log"].includes(ext)) return "text";
  if ([".doc", ".docx", ".pages", ".rtf"].includes(ext)) return "document";
  return "other";
}

function listFiles() {
  fs.mkdirSync(FILES_DIR, { recursive: true });
  return fs.readdirSync(FILES_DIR)
    .map((name) => {
      const filePath = path.join(FILES_DIR, name);
      const stat = fs.statSync(filePath);
      return {
        name,
        path: filePath,
        size: stat.size,
        kind: fileKind(name),
        modifiedAt: stat.mtime.toISOString()
      };
    })
    .filter((item) => fs.statSync(item.path).isFile())
    .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
}

function safeFilePath(name) {
  const safeName = path.basename(String(name || ""));
  if (!safeName) throw new Error("Choose a file first.");
  const filePath = path.join(FILES_DIR, safeName);
  if (!filePath.startsWith(FILES_DIR)) throw new Error("Invalid file path.");
  return filePath;
}

function uniqueDestination(name) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
  const parsed = path.parse(path.basename(name));
  let candidate = path.join(FILES_DIR, path.basename(name));
  let index = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(FILES_DIR, `${parsed.name}-${index}${parsed.ext}`);
    index += 1;
  }
  return candidate;
}

function loadEnv() {
  const envPath = path.join(DATA_ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

function emitActivity(message, level = "info") {
  logEvent(message, level);
  if (!mainWindow) return;
  mainWindow.webContents.send("activity", {
    message,
    level,
    at: new Date().toISOString()
  });
}

function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(tick, 350);
      });
      request.setTimeout(1000, () => request.destroy());
    };
    tick();
  });
}

async function loadWorkbench(window) {
  const exportedIndex = path.join(ROOT, "ui", "out", "index.html");
  const shouldUseDevServer = process.env.BYTEOS_NEXT_DEV === "1" || !fs.existsSync(exportedIndex);

  if (shouldUseDevServer) {
    if (!nextDevProcess) {
      nextDevProcess = spawn("npm", ["run", "next:dev"], {
        cwd: ROOT,
        stdio: "ignore",
        env: { ...process.env, BROWSER: "none" }
      });
    }
    await waitForUrl("http://127.0.0.1:3020");
    await window.loadURL("http://127.0.0.1:3020");
    return;
  }

  await window.loadFile(exportedIndex);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "ByteOS",
    backgroundColor: "#0f141b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  loadWorkbench(mainWindow).catch((error) => {
    dialog.showErrorBox("ByteOS failed to start", error.message);
  });
}

function runFile(command, args = [], input = null) {
  return new Promise((resolve) => {
    const child = execFile(command, args, { timeout: 30000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        error: error ? error.message : ""
      });
    });
    if (input !== null) {
      child.stdin.end(input);
    }
  });
}

async function runAppleScript(script) {
  return runFile("osascript", ["-e", script]);
}

function macPermissionMessage(errorText) {
  const text = errorText || "";
  const lowered = text.toLowerCase();
  if (lowered.includes("not allowed") || lowered.includes("not authorized") || lowered.includes("access")) {
    return "macOS blocked this action. Grant ByteOS or Terminal Accessibility, Automation, Screen Recording, and Microphone permissions in System Settings > Privacy & Security.";
  }
  return text || "The Mac action failed.";
}

async function takeScreenshot() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(SCREENSHOTS_DIR, `screen_${timestamp}.png`);
  const result = await runFile("screencapture", ["-x", filePath]);
  if (!result.ok) throw new Error(macPermissionMessage(result.stderr || result.error));
  return filePath;
}

async function macAction(action, value = "") {
  const text = String(value || "").trim();
  if (action === "open-app") return runFile("open", ["-a", text]);
  if (action === "open-url") return runFile("open", [text.startsWith("http") ? text : `https://${text}`]);
  if (action === "open-folder") {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] });
    if (result.canceled || !result.filePaths[0]) return { ok: true, stdout: "No folder selected.", stderr: "", error: "" };
    await shell.openPath(result.filePaths[0]);
    return { ok: true, stdout: `Opened ${result.filePaths[0]}`, stderr: "", error: "" };
  }
  if (action === "open-file") {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ["openFile"] });
    if (result.canceled || !result.filePaths[0]) return { ok: true, stdout: "No file selected.", stderr: "", error: "" };
    await shell.openPath(result.filePaths[0]);
    return { ok: true, stdout: `Opened ${result.filePaths[0]}`, stderr: "", error: "" };
  }
  if (action === "quit-app") {
    return runAppleScript(`tell application ${JSON.stringify(text)} to quit`);
  }
  if (action === "active-app") {
    return runAppleScript('tell application "System Events" to get name of first application process whose frontmost is true');
  }
  if (action === "list-apps") {
    return runAppleScript('tell application "System Events" to get name of every application process whose background only is false');
  }
  if (action === "spotlight") {
    return runAppleScript(`tell application "System Events"
      key code 49 using command down
      delay 0.2
      keystroke ${JSON.stringify(text)}
      delay 0.2
      key code 36
    end tell`);
  }
  if (action === "type") {
    return runAppleScript(`tell application "System Events" to keystroke ${JSON.stringify(text)}`);
  }
  if (action === "speak") return runFile("say", [text]);
  if (action === "stop-speaking") return runFile("killall", ["say"]);
  if (action === "copy") return runFile("pbcopy", [], text);
  if (action === "read-clipboard") return runFile("pbpaste");
  if (action === "volume") return runAppleScript("output volume of (get volume settings)");
  if (action === "set-volume") return runAppleScript(`set volume output volume ${Math.max(0, Math.min(100, Number(text || 50)))}`);
  if (action === "battery") return runFile("pmset", ["-g", "batt"]);
  if (action === "wifi") return runFile("networksetup", ["-getairportpower", "en0"]);
  if (action === "bluetooth") return runFile("system_profiler", ["SPBluetoothDataType"]);
  if (action === "notification") {
    return runAppleScript(`display notification ${JSON.stringify(text || "ByteOS is running")} with title "ByteOS"`);
  }
  if (action === "lock-screen") {
    return runFile("/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession", ["-suspend"]);
  }
  if (action === "sleep") return runFile("pmset", ["sleepnow"]);
  throw new Error(`Unknown action: ${action}`);
}

function trimText(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(-maxChars);
}

function buildGeminiBody({ prompt, config, memory, history, screenshotPath }) {
  const memoryText = trimText(JSON.stringify(memory, null, 2), Number(config.max_memory_chars || 8000));
  const contents = history.slice(-Number(config.max_history_messages || 12)).map((item) => ({
    role: item.role,
    parts: [{ text: item.text }]
  }));

  const parts = [{
    text: `Saved memory, notes, and todos:\n${memoryText}\n\nCurrent user message: ${prompt}`
  }];

  if (screenshotPath) {
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: fs.readFileSync(screenshotPath).toString("base64")
      }
    });
  }

  contents.push({ role: "user", parts });

  return {
    system_instruction: {
      parts: [{
        text: `You are ${config.assistant_name}, a local macOS assistant app. Answer clearly and help the user control their Mac safely. Suggest UI actions or Mac control actions when useful.`
      }]
    },
    contents,
    generationConfig: {
      temperature: Number(config.temperature || 0.5),
      maxOutputTokens: Number(config.max_output_tokens || 512)
    }
  };
}

async function callGemini(prompt, screenshotPath = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, reply: "GEMINI_API_KEY is missing. Add it in Settings or .env, then restart ByteOS." };
  }

  const config = readConfig();
  const memory = readMemory();
  const history = readHistory();
  const body = buildGeminiBody({ prompt, config, memory, history, screenshotPath });
  const models = [config.model, ...(config.fallback_models || [])].filter((model, index, arr) => model && arr.indexOf(model) === index);
  let lastError = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(config.api_timeout_seconds || 20) * 1000);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok) {
        lastError = data?.error?.message || `Gemini error ${response.status}`;
        emitActivity(`${model}: ${lastError}`, "warn");
        if ([429, 500, 502, 503, 504, 404].includes(response.status)) continue;
        return { ok: false, reply: lastError };
      }
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "The model returned an empty response.";
      return { ok: true, reply: model === config.model ? reply : `${reply}\n\n[Used fallback model: ${model}]` };
    } catch (error) {
      lastError = error.message;
      emitActivity(`${model}: ${lastError}`, "warn");
    }
  }

  return { ok: false, reply: `All configured models failed. Last error: ${lastError}` };
}

function routeLocalInstruction(text) {
  const lower = text.toLowerCase().trim();
  if (lower.startsWith("open ")) return { action: "open-app", value: text.slice(5) };
  if (lower.startsWith("quit ")) return { action: "quit-app", value: text.slice(5) };
  if (lower.startsWith("type ")) return { action: "type", value: text.slice(5) };
  if (lower.startsWith("say ")) return { action: "speak", value: text.slice(4) };
  if (lower.startsWith("copy ")) return { action: "copy", value: text.slice(5) };
  if (lower.startsWith("go to ") || lower.startsWith("open website ")) {
    return { action: "open-url", value: text.replace(/^go to |^open website /i, "") };
  }
  if (lower === "what is on my screen" || lower === "see screen") return { action: "see-screen" };
  if (lower === "take screenshot") return { action: "screenshot" };
  return null;
}

function startAutomations() {
  for (const timer of automationTimers.values()) clearInterval(timer);
  automationTimers.clear();

  for (const item of readAutomations()) {
    if (!item.enabled) continue;
    const intervalMs = Math.max(1, Number(item.intervalMinutes || 30)) * 60 * 1000;
    const timer = setInterval(() => {
      emitActivity(`Automation: ${item.name}`, "automation");
      if (item.kind === "speak") runFile("say", [item.payload || item.name]);
      if (item.kind === "open-url" && item.payload) runFile("open", [item.payload]);
    }, intervalMs);
    automationTimers.set(item.id, timer);
  }
}

ipcMain.handle("app:state", async () => ({
  config: readConfig(),
  memory: readMemory(),
  history: readHistory(),
  automations: readAutomations(),
  files: listFiles(),
  logs: readLogs(),
  hasApiKey: Boolean(process.env.GEMINI_API_KEY)
}));

ipcMain.handle("chat:send", async (_event, payload) => {
  const prompt = String(payload?.prompt || "").trim();
  if (!prompt) return { ok: false, reply: "Type a message first." };

  const localRoute = routeLocalInstruction(prompt);
  if (localRoute) {
    let reply = "";
    let ok = true;
    if (localRoute.action === "screenshot") {
      const screenshotPath = await takeScreenshot();
      reply = `Screenshot saved: ${path.basename(screenshotPath)}`;
      saveChatTurn(prompt, reply);
      return { ok: true, reply };
    }
    if (localRoute.action === "see-screen") {
      const screenshotPath = await takeScreenshot();
      const result = await callGemini("Describe what is visible on my Mac screen and suggest next actions.", screenshotPath);
      if (result.ok) saveChatTurn(prompt, result.reply);
      return result;
    }
    const result = await macAction(localRoute.action, localRoute.value);
    ok = result.ok;
    reply = result.ok ? (result.stdout || "Done.") : macPermissionMessage(result.stderr || result.error);
    saveChatTurn(prompt, reply);
    return { ok, reply };
  }

  const result = await callGemini(prompt);
  if (result.ok) {
    saveChatTurn(prompt, result.reply);
  }
  return result;
});

ipcMain.handle("mac:action", async (_event, payload) => {
  try {
    const { action, value } = payload || {};
    if (action === "screenshot") {
      const screenshotPath = await takeScreenshot();
      return { ok: true, message: `Screenshot saved: ${screenshotPath}`, path: screenshotPath };
    }
    if (action === "see-screen") {
      const screenshotPath = await takeScreenshot();
      const result = await callGemini("Describe what is visible on my Mac screen and suggest next actions.", screenshotPath);
      return { ...result, path: screenshotPath };
    }
    const result = await macAction(action, value);
    return { ok: result.ok, message: result.ok ? (result.stdout || "Done.") : macPermissionMessage(result.stderr || result.error) };
  } catch (error) {
    return { ok: false, message: error.message };
  }
});

ipcMain.handle("settings:save", async (_event, nextConfig) => {
  const config = { ...readConfig(), ...nextConfig };
  writeConfig(config);
  emitActivity("Settings saved.", "info");
  return config;
});

ipcMain.handle("settings:mode", async (_event, mode) => {
  const config = { ...readConfig(), ...(MODE_PRESETS[mode] || {}), response_mode: mode };
  writeConfig(config);
  return config;
});

ipcMain.handle("memory:update", async (_event, nextMemory) => {
  writeMemory(nextMemory);
  return readMemory();
});

ipcMain.handle("automations:save", async (_event, automations) => {
  writeAutomations(automations);
  startAutomations();
  return readAutomations();
});

ipcMain.handle("files:import", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Useful files", extensions: ["png", "jpg", "jpeg", "webp", "gif", "pdf", "txt", "md", "json", "csv", "doc", "docx", "rtf"] },
      { name: "All files", extensions: ["*"] }
    ]
  });
  if (result.canceled) return listFiles();
  for (const source of result.filePaths) {
    const destination = uniqueDestination(source);
    fs.copyFileSync(source, destination);
    logEvent(`Imported file: ${path.basename(destination)}`, "info");
  }
  return listFiles();
});

ipcMain.handle("files:delete", async (_event, name) => {
  const filePath = safeFilePath(name);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  logEvent(`Deleted file: ${path.basename(filePath)}`, "warn");
  return listFiles();
});

ipcMain.handle("files:rename", async (_event, payload) => {
  const currentPath = safeFilePath(payload?.name);
  const nextName = path.basename(String(payload?.nextName || "").trim());
  if (!nextName) throw new Error("Enter a new file name.");
  const nextPath = uniqueDestination(nextName);
  fs.renameSync(currentPath, nextPath);
  logEvent(`Renamed file to: ${path.basename(nextPath)}`, "info");
  return listFiles();
});

ipcMain.handle("files:analyze", async (_event, name) => {
  const filePath = safeFilePath(name);
  if (!fs.existsSync(filePath)) return { ok: false, reply: "That file no longer exists." };
  const kind = fileKind(filePath);
  let context = `Analyze this local ${kind} file named ${path.basename(filePath)}.`;
  if (kind === "text") {
    context += `\n\nFile contents:\n${trimText(fs.readFileSync(filePath, "utf8"), 12000)}`;
  } else {
    context += "\n\nSummarize what it is likely useful for and suggest next actions. If you need visual/PDF extraction, say what permission or tool is needed.";
  }
  const result = await callGemini(context);
  logEvent(`Analyzed file: ${path.basename(filePath)}`, result.ok ? "info" : "warn");
  return result;
});

ipcMain.handle("logs:clear", async () => {
  writeLogs([]);
  return [];
});

ipcMain.handle("chat:export", async () => {
  const destination = dialog.showSaveDialogSync(mainWindow, {
    title: "Export ByteOS chat",
    defaultPath: `byteos-chat-${new Date().toISOString().slice(0, 10)}.md`,
    filters: [{ name: "Markdown", extensions: ["md"] }]
  });
  if (!destination) return { ok: false, message: "Export cancelled." };
  const content = readHistory().map((item) => `## ${item.role === "user" ? "You" : "ByteOS"}\n\n${item.text}`).join("\n\n");
  fs.writeFileSync(destination, content || "# ByteOS Chat\n\nNo messages yet.\n");
  return { ok: true, path: destination, message: `Exported chat to ${destination}` };
});

ipcMain.handle("open:external", async (_event, target) => {
  await shell.openExternal(target);
  return true;
});

ipcMain.handle("open:file", async (_event, target) => {
  await shell.openPath(target);
  return true;
});

ipcMain.handle("key:save", async (_event, apiKey) => {
  const envPath = path.join(DATA_ROOT, ".env");
  fs.writeFileSync(envPath, `GEMINI_API_KEY=${String(apiKey || "").trim()}\n`);
  process.env.GEMINI_API_KEY = String(apiKey || "").trim();
  return { ok: true, hasApiKey: Boolean(process.env.GEMINI_API_KEY) };
});

ipcMain.handle("dialog:message", async (_event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

app.whenReady().then(() => {
  loadEnv();
  ensureJson(CONFIG_PATH, DEFAULT_CONFIG);
  ensureJson(MEMORY_PATH, { facts: [], notes: [], todos: [] });
  ensureJson(HISTORY_PATH, []);
  ensureJson(AUTOMATIONS_PATH, []);
  ensureJson(LOGS_PATH, []);
  fs.mkdirSync(FILES_DIR, { recursive: true });
  createWindow();
  startAutomations();
});

app.on("window-all-closed", () => {
  if (nextDevProcess) nextDevProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextDevProcess) nextDevProcess.kill();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
