import { buildMockAssistantResponse } from "@/services/chat";
import type {
  AiGenerationRequest,
  AiGenerationResult,
  AiProviderId,
  AiProviderModel,
  AiProviderState,
  AiProviderStatus,
} from "@/types/ai";

const env = import.meta.env as ImportMetaEnv & {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_OLLAMA_MODEL?: string;
};

export const defaultGeminiApiKey = env.VITE_GEMINI_API_KEY ?? "";
const defaultOllamaModel = env.VITE_OLLAMA_MODEL ?? "llama3.2";
const defaultGeminiModel = env.VITE_GEMINI_MODEL ?? "gemini-1.5-flash";

export const aiProviderModels: AiProviderModel[] = [
  {
    id: "auto",
    label: "Auto fallback",
    provider: "auto",
    description: "Ollama, then Gemini, then safe mock",
  },
  {
    id: `ollama:${defaultOllamaModel}`,
    label: `Ollama ${defaultOllamaModel}`,
    provider: "ollama",
    description: "Local streaming via Ollama",
  },
  {
    id: `gemini:${defaultGeminiModel}`,
    label: `Gemini ${defaultGeminiModel}`,
    provider: "gemini",
    description: "Gemini API with streaming",
  },
  {
    id: "mock",
    label: "Safe mock",
    provider: "mock",
    description: "Local fallback without network",
  },
];

export function getModelName(model: AiProviderModel) {
  return model.id.includes(":") ? model.id.split(":").slice(1).join(":") : model.id;
}

export function getProviderLabel(providerId: AiProviderId) {
  const labels: Record<AiProviderId, string> = {
    auto: "Auto",
    gemini: "Gemini",
    mock: "Mock",
    ollama: "Ollama",
  };

  return labels[providerId];
}

export async function getProviderStates(apiKey: string): Promise<AiProviderState[]> {
  const online = navigator.onLine;
  const [ollamaStatus] = await Promise.all([checkOllamaStatus()]);
  const geminiStatus: AiProviderStatus = !online ? "offline" : apiKey ? "ready" : "missing-key";

  return [
    {
      id: "auto",
      label: "Auto",
      status: online || ollamaStatus === "ready" ? "ready" : "offline",
      detail: "Falls back safely across providers",
    },
    {
      id: "ollama",
      label: "Ollama",
      status: ollamaStatus,
      detail: ollamaStatus === "ready" ? "Local server detected" : "Start Ollama on port 11434",
    },
    {
      id: "gemini",
      label: "Gemini",
      status: geminiStatus,
      detail: apiKey ? "API key configured" : "Add key in settings or VITE_GEMINI_API_KEY",
    },
    {
      id: "mock",
      label: "Mock",
      status: "ready",
      detail: "Always available",
    },
  ];
}

async function checkOllamaStatus(): Promise<AiProviderStatus> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags", {
      signal: controller.signal,
    });

    return response.ok ? "ready" : "unavailable";
  } catch {
    return "unavailable";
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function streamAiResponse(
  request: AiGenerationRequest,
): Promise<AiGenerationResult> {
  const provider = request.model.provider;

  if (provider === "mock") {
    await streamMockResponse(request);
    return { providerId: "mock", usedFallback: false };
  }

  if (provider === "ollama") {
    return attemptWithFallback(request, "ollama");
  }

  if (provider === "gemini") {
    return attemptWithFallback(request, "gemini");
  }

  const attempts: AiProviderId[] = ["ollama", "gemini", "mock"];
  let lastError: unknown;

  for (const providerId of attempts) {
    try {
      await runProvider(providerId, request);
      return { providerId, usedFallback: providerId !== "ollama" };
    } catch (error) {
      if (request.signal.aborted) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All providers failed.");
}

async function attemptWithFallback(
  request: AiGenerationRequest,
  providerId: AiProviderId,
): Promise<AiGenerationResult> {
  try {
    await runProvider(providerId, request);
    return { providerId, usedFallback: false };
  } catch (error) {
    if (request.signal.aborted) {
      throw error;
    }

    await streamMockResponse(request);
    return { providerId: "mock", usedFallback: true };
  }
}

async function runProvider(providerId: AiProviderId, request: AiGenerationRequest) {
  if (providerId === "ollama") {
    await streamOllamaResponse(request);
    return;
  }

  if (providerId === "gemini") {
    await streamGeminiResponse(request);
    return;
  }

  await streamMockResponse(request);
}

async function streamOllamaResponse({ messages, model, onToken, signal }: AiGenerationRequest) {
  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    body: JSON.stringify({
      messages: messages.map((message) => ({
        content: message.content,
        role: message.role,
      })),
      model: getModelName(model),
      stream: true,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error("Ollama did not return a streaming response.");
  }

  await readNdjsonStream(response.body, (payload) => {
    const token = typeof payload.message?.content === "string" ? payload.message.content : "";
    if (token) {
      onToken(token);
    }
  });
}

async function streamGeminiResponse({ apiKey, messages, model, onToken, signal }: AiGenerationRequest) {
  if (!navigator.onLine) {
    throw new Error("Gemini is unavailable while offline.");
  }

  if (!apiKey) {
    throw new Error("Gemini API key is missing.");
  }

  const prompt = messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    getModelName(model),
  )}:streamGenerateContent?alt=sse`;
  const response = await fetch(url, {
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }], role: "user" }],
    }),
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    method: "POST",
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error("Gemini did not return a streaming response.");
  }

  await readSseStream(response.body, (payload) => {
    const token =
      payload.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";
    if (token) {
      onToken(token);
    }
  });
}

async function streamMockResponse({ messages, model, onToken, signal }: AiGenerationRequest) {
  const lastPrompt = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const response = buildMockAssistantResponse(lastPrompt, model.label);
  const chunks = response.match(/.{1,34}(\s|$)/g) ?? [response];

  for (const chunk of chunks) {
    if (signal.aborted) {
      throw new DOMException("Generation stopped.", "AbortError");
    }

    onToken(chunk);
    await new Promise((resolve) => window.setTimeout(resolve, 35));
  }
}

async function readNdjsonStream(
  body: ReadableStream<Uint8Array>,
  onPayload: (payload: { message?: { content?: string } }) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      onPayload(JSON.parse(trimmed));
    }
  }

  const remaining = buffer.trim();
  if (remaining) {
    onPayload(JSON.parse(remaining));
  }
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onPayload: (payload: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      parseSseEvent(event, onPayload);
    }
  }

  parseSseEvent(buffer, onPayload);
}

function parseSseEvent(
  event: string,
  onPayload: (payload: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }) => void,
) {
  const dataLine = event
    .split("\n")
    .find((line) => line.startsWith("data: "))
    ?.slice(6)
    .trim();

  if (!dataLine || dataLine === "[DONE]") {
    return;
  }

  onPayload(JSON.parse(dataLine));
}
