import { useEffect, useMemo, useRef, useState } from "react";
import {
  createConversation,
  createInitialConversations,
  createMessage,
  titleFromPrompt,
} from "@/services/chat";
import {
  aiProviderModels,
  defaultGeminiApiKey,
  getProviderLabel,
  getProviderStates,
  streamAiResponse,
} from "@/services/ai-providers";
import type { AiProviderState } from "@/types/ai";
import type { Conversation, UploadedAttachment } from "@/types/chat";

type ChatError = {
  message: string;
};

export function useLocalChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    createInitialConversations(),
  );
  const [activeConversationId, setActiveConversationId] = useState(() => conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(aiProviderModels[0].id);
  const [geminiApiKey, setGeminiApiKey] = useState(defaultGeminiApiKey);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const [providerStates, setProviderStates] = useState<AiProviderState[]>([]);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [activeProviderLabel, setActiveProviderLabel] = useState("Safe mock");
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations],
  );

  const selectedModel = useMemo(
    () => aiProviderModels.find((model) => model.id === selectedModelId) ?? aiProviderModels[0],
    [selectedModelId],
  );

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [conversations],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function syncOnlineState() {
      setOffline(!navigator.onLine);
    }

    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshStates() {
      const states = await getProviderStates(geminiApiKey.trim());
      if (active) {
        setProviderStates(states);
      }
    }

    void refreshStates();
    const interval = window.setInterval(() => void refreshStates(), 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [geminiApiKey, offline]);

  function flashStatus(message: string) {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 2200);
  }

  function updateConversation(
    conversationId: string,
    updater: (conversation: Conversation) => Conversation,
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation,
      ),
    );
  }

  function appendMessage(conversationId: string, message = createMessage("assistant", "")) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, message],
      updatedAt: new Date().toISOString(),
    }));
    return message;
  }

  function appendToMessage(conversationId: string, messageId: string, token: string) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.id === messageId ? { ...message, content: `${message.content}${token}` } : message,
      ),
      updatedAt: new Date().toISOString(),
    }));
  }

  async function startAiResponse(conversationId: string, prompt: string) {
    setIsGenerating(true);
    setError(null);
    setActiveProviderLabel(selectedModel.label);
    const assistantMessage = appendMessage(conversationId);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const messagesForProvider = [
      ...(conversations.find((conversation) => conversation.id === conversationId)?.messages ?? []),
      createMessage("user", prompt),
    ];

    try {
      const result = await streamAiResponse({
        apiKey: geminiApiKey.trim(),
        messages: messagesForProvider,
        model: selectedModel,
        onToken: (token) => appendToMessage(conversationId, assistantMessage.id, token),
        signal: controller.signal,
      });
      const providerLabel = getProviderLabel(result.providerId);
      setActiveProviderLabel(providerLabel);
      if (result.usedFallback) {
        setError({ message: `Selected provider was unavailable. ByteOS used ${providerLabel} fallback.` });
      }
      flashStatus(result.usedFallback ? `Used ${providerLabel} fallback` : `${providerLabel} response ready`);
    } catch (generationError) {
      if (controller.signal.aborted) {
        appendToMessage(conversationId, assistantMessage.id, "\n\n_Generation stopped._");
        flashStatus("Generation stopped");
      } else {
        updateConversation(conversationId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.filter((message) => message.id !== assistantMessage.id),
          updatedAt: new Date().toISOString(),
        }));
        setError({
          message:
            generationError instanceof Error
              ? generationError.message
              : "The selected provider failed. Safe mock fallback is still available.",
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function sendMessage(content = draft) {
    const trimmed = content.trim();

    if (!trimmed || isGenerating || !activeConversation) {
      return;
    }

    const userMessage = createMessage("user", trimmed);
    const shouldRename = activeConversation.messages.length === 0 || activeConversation.title === "Untitled Chat";

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      title: shouldRename ? titleFromPrompt(trimmed) : conversation.title,
      messages: [...conversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
    }));
    setDraft("");
    setAttachments([]);
    void startAiResponse(activeConversation.id, trimmed);
  }

  function stopGeneration() {
    if (!abortControllerRef.current) {
      return;
    }

    abortControllerRef.current.abort();
  }

  function retryLastResponse() {
    if (!activeConversation || isGenerating) {
      return;
    }

    const lastUserMessage = [...activeConversation.messages].reverse().find((message) => message.role === "user");

    if (!lastUserMessage) {
      setError({ message: "Send a message before retrying a response." });
      return;
    }

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages:
        conversation.messages[conversation.messages.length - 1]?.role === "assistant"
          ? conversation.messages.slice(0, -1)
          : conversation.messages,
      updatedAt: new Date().toISOString(),
    }));
    void startAiResponse(activeConversation.id, lastUserMessage.content);
  }

  function createNewChat() {
    const conversation = createConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setDraft("");
    setError(null);
  }

  function renameConversation(conversationId: string, title: string) {
    const trimmed = title.trim();

    if (!trimmed) {
      setError({ message: "Conversation title cannot be empty." });
      return;
    }

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: trimmed,
      updatedAt: new Date().toISOString(),
    }));
    flashStatus("Conversation renamed");
  }

  function deleteConversation(conversationId: string) {
    setConversations((current) => {
      const remaining = current.filter((conversation) => conversation.id !== conversationId);

      if (conversationId === activeConversationId) {
        const next = remaining[0] ?? createConversation();
        setActiveConversationId(next.id);
        return remaining.length > 0 ? remaining : [next];
      }

      return remaining;
    });
    flashStatus("Conversation deleted");
  }

  function togglePinConversation(conversationId: string) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      pinned: !conversation.pinned,
      updatedAt: new Date().toISOString(),
    }));
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const nextFiles = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      type: file.type || "file",
      size: file.size,
    }));

    setAttachments((current) => [...current, ...nextFiles]);
    flashStatus(`${nextFiles.length} file${nextFiles.length === 1 ? "" : "s"} attached locally`);
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  function useSuggestion(suggestion: string) {
    setDraft(suggestion);
  }

  function copySucceeded(label: string) {
    flashStatus(`${label} copied`);
  }

  return {
    activeConversation,
    activeConversationId,
    attachments,
    conversations: sortedConversations,
    draft,
    error,
    isGenerating,
    selectedModel,
    selectedModelId,
    activeProviderLabel,
    statusMessage,
    geminiApiKey,
    offline,
    providerStates,
    addFiles,
    copySucceeded,
    createNewChat,
    deleteConversation,
    removeAttachment,
    renameConversation,
    retryLastResponse,
    sendMessage,
    setActiveConversationId,
    setDraft,
    setError,
    setGeminiApiKey,
    setSelectedModelId,
    stopGeneration,
    togglePinConversation,
    useSuggestion,
  };
}
