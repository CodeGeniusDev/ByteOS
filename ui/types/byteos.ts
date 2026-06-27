export type Role = "user" | "model";

export type AssistantConfig = {
  assistant_name: string;
  provider: string;
  model: string;
  fallback_models: string[];
  temperature: number;
  memory_file: string;
  history_file: string;
  notes_dir: string;
  screenshots_dir?: string;
  response_mode: "fast" | "balanced" | "deep" | string;
  max_memory_chars: number;
  max_history_messages: number;
  max_output_tokens: number;
  api_timeout_seconds: number;
  retry_attempts: number;
  allow_shell_commands: boolean;
};

export type MemoryState = {
  facts: string[];
  notes: Array<{ text: string; created_at?: string; category?: string; pinned?: boolean; importance?: number }>;
  todos: Array<{ text: string; done: boolean }>;
};

export type ChatMessage = {
  role: Role;
  text: string;
  at?: string;
  pinned?: boolean;
};

export type Automation = {
  id: string;
  name: string;
  kind: "speak" | "open-url";
  payload: string;
  intervalMinutes: number;
  enabled: boolean;
};

export type ActivityItem = {
  id: string;
  message: string;
  level: "info" | "warn" | "error" | "automation";
  at: string;
};

export type WorkbenchFile = {
  name: string;
  path: string;
  size: number;
  kind: "image" | "pdf" | "text" | "document" | "other";
  modifiedAt: string;
};

export type RuntimeLog = ActivityItem;

export type AppState = {
  config: AssistantConfig;
  memory: MemoryState;
  history: ChatMessage[];
  automations: Automation[];
  files: WorkbenchFile[];
  logs: RuntimeLog[];
  hasApiKey: boolean;
};

export type MacActionPayload = {
  action: string;
  value?: string;
};

export type MacActionResult = {
  ok: boolean;
  message?: string;
  reply?: string;
  path?: string;
};

export type ChatResult = {
  ok: boolean;
  reply: string;
};

export type ByteOSApi = {
  getState: () => Promise<AppState>;
  sendChat: (payload: { prompt: string }) => Promise<ChatResult>;
  macAction: (payload: MacActionPayload) => Promise<MacActionResult>;
  saveSettings: (config: Partial<AssistantConfig>) => Promise<AssistantConfig>;
  setMode: (mode: "fast" | "balanced" | "deep") => Promise<AssistantConfig>;
  updateMemory: (memory: MemoryState) => Promise<MemoryState>;
  saveAutomations: (automations: Automation[]) => Promise<Automation[]>;
  saveApiKey: (apiKey: string) => Promise<{ ok: boolean; hasApiKey: boolean }>;
  importFiles: () => Promise<WorkbenchFile[]>;
  deleteFile: (name: string) => Promise<WorkbenchFile[]>;
  renameFile: (payload: { name: string; nextName: string }) => Promise<WorkbenchFile[]>;
  analyzeFile: (name: string) => Promise<ChatResult>;
  clearLogs: () => Promise<RuntimeLog[]>;
  exportChat: () => Promise<{ ok: boolean; path?: string; message: string }>;
  openExternal: (target: string) => Promise<boolean>;
  openFile: (target: string) => Promise<boolean>;
  showMessage: (options: unknown) => Promise<unknown>;
  onActivity: (callback: (payload: Omit<ActivityItem, "id">) => void) => void;
};

declare global {
  interface Window {
    byteos?: ByteOSApi;
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}
