import type { ChatMessage } from "@/types/chat";

export type AiProviderId = "auto" | "ollama" | "gemini" | "mock";

export type AiProviderStatus = "checking" | "ready" | "missing-key" | "offline" | "unavailable";

export type AiProviderModel = {
  id: string;
  label: string;
  provider: AiProviderId;
  description: string;
};

export type AiProviderState = {
  id: AiProviderId;
  label: string;
  status: AiProviderStatus;
  detail: string;
};

export type AiGenerationRequest = {
  apiKey?: string;
  messages: ChatMessage[];
  model: AiProviderModel;
  onToken: (token: string) => void;
  signal: AbortSignal;
};

export type AiGenerationResult = {
  providerId: AiProviderId;
  usedFallback: boolean;
};
