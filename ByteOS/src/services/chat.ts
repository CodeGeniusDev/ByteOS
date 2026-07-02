import type { ChatMessage, ChatModel, Conversation } from "@/types/chat";

const now = () => new Date().toISOString();

export const chatModels: ChatModel[] = [
  { id: "byteos-local", name: "ByteOS Local", description: "Safe mock assistant" },
  { id: "byteos-fast", name: "ByteOS Fast", description: "Short local drafts" },
  { id: "byteos-pro", name: "ByteOS Pro", description: "Structured local drafts" },
];

export const promptSuggestions = [
  "Summarize this workspace plan",
  "Draft a clean task checklist",
  "Explain this code snippet",
  "Create a macOS automation outline",
];

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createConversation(title = "Untitled Chat"): Conversation {
  const timestamp = now();

  return {
    id: createId("chat"),
    title,
    pinned: false,
    messages: [],
    updatedAt: timestamp,
  };
}

export function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: createId(role),
    role,
    content,
    createdAt: now(),
  };
}

export function createInitialConversations(): Conversation[] {
  const welcome = createConversation("ByteOS Phase 2");
  welcome.messages = [
    createMessage(
      "assistant",
      "Welcome to the local ByteOS chat foundation. Send a message to generate a safe mock response with **Markdown** and code block support.",
    ),
  ];

  return [welcome];
}

export function titleFromPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Untitled Chat";
  }

  return normalized.length > 34 ? `${normalized.slice(0, 34).trim()}...` : normalized;
}

export function buildMockAssistantResponse(prompt: string, modelName: string) {
  const trimmed = prompt.trim();

  return [
    `I am running in **local mock mode** with ${modelName}. No AI API call was made.`,
    "",
    `Here is a safe response scaffold for: "${trimmed}"`,
    "",
    "- Capture the goal clearly.",
    "- Split work into small, verifiable steps.",
    "- Keep UI behavior local until a real provider is connected.",
    "",
    "```ts",
    "type ByteOSChatMode = \"local-mock\" | \"provider-ready\";",
    "",
    "const mode: ByteOSChatMode = \"local-mock\";",
    "```",
  ].join("\n");
}
