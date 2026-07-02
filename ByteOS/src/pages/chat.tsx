import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatContextPanel } from "@/components/chat/chat-context-panel";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalChat } from "@/hooks/use-local-chat";
import { useVoiceAssistant } from "@/hooks/use-voice-assistant";
import type { ChatMessage } from "@/types/chat";

export function ChatPage() {
  const chat = useLocalChat();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messages = useMemo(
    () => chat.activeConversation?.messages ?? [],
    [chat.activeConversation?.messages],
  );
  const lastSpokenAssistantIdRef = useRef<string | null>(
    [...messages].reverse().find((message) => message.role === "assistant")?.id ?? null,
  );
  const voice = useVoiceAssistant({
    onTranscriptFinal: (transcript, autoSend) => {
      if (autoSend) {
        chat.sendMessage(transcript);
        return;
      }

      chat.setDraft(transcript);
    },
  });
  const liveTranscript = [voice.finalTranscript, voice.interimTranscript].filter(Boolean).join(" ");

  useEffect(() => {
    const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");

    if (!latestAssistant || chat.isGenerating) {
      return;
    }

    if (lastSpokenAssistantIdRef.current === latestAssistant.id) {
      return;
    }

    lastSpokenAssistantIdRef.current = latestAssistant.id;
    voice.speak(latestAssistant.content);
  }, [chat.isGenerating, messages, voice]);

  async function copyText(text: string, label: string, messageId?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (messageId) {
        setCopiedMessageId(messageId);
        window.setTimeout(() => setCopiedMessageId(null), 1600);
      }
      chat.copySucceeded(label);
    } catch {
      chat.setError({ message: "Clipboard access is unavailable in this browser session." });
    }
  }

  function copyMessage(message: ChatMessage) {
    void copyText(message.content, "Message", message.id);
  }

  function copyCode(code: string) {
    void copyText(code, "Code block");
  }

  return (
    <div className="grid min-h-[calc(100vh-10rem)] gap-4 xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
      <ConversationSidebar
        activeConversationId={chat.activeConversationId}
        conversations={chat.conversations}
        onCreateConversation={chat.createNewChat}
        onDeleteConversation={chat.deleteConversation}
        onRenameConversation={chat.renameConversation}
        onSelectConversation={chat.setActiveConversationId}
        onTogglePin={chat.togglePinConversation}
      />

      <Card className="grid min-h-[38rem] grid-rows-[auto_1fr_auto] overflow-hidden">
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="size-5 text-primary" />
                {chat.activeConversation?.title ?? "Chat"}
              </CardTitle>
              <CardDescription>
                Streaming AI providers with safe mock fallback and local chat history.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Clock3 className="size-3.5" />
                {chat.activeProviderLabel}
              </Badge>
              {chat.statusMessage ? (
                <Badge>
                  <CheckCircle2 className="size-3.5" />
                  {chat.statusMessage}
                </Badge>
              ) : null}
            </div>
          </div>
          {chat.error ? (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {chat.error.message}
            </div>
          ) : null}
        </CardHeader>

        <MessageList
          copiedMessageId={copiedMessageId}
          isGenerating={chat.isGenerating}
          messages={messages}
          onCopyCode={copyCode}
          onCopyMessage={copyMessage}
          onRetryResponse={chat.retryLastResponse}
          onUseSuggestion={chat.useSuggestion}
        />

        <ChatComposer
          attachments={chat.attachments}
          draft={chat.draft}
          isGenerating={chat.isGenerating}
          isListening={voice.isListening}
          isSpeaking={voice.isSpeaking}
          liveTranscript={liveTranscript}
          voiceEnabled={voice.settings.enabled}
          voiceStatus={voice.status}
          onAddFiles={chat.addFiles}
          onDraftChange={chat.setDraft}
          onRemoveAttachment={chat.removeAttachment}
          onSendMessage={chat.sendMessage}
          onStopSpeaking={voice.stopSpeaking}
          onStopGeneration={chat.stopGeneration}
          onVoiceClick={voice.toggleListening}
        />
      </Card>

      <ChatContextPanel
        activeProviderLabel={chat.activeProviderLabel}
        geminiApiKey={chat.geminiApiKey}
        messageCount={messages.length}
        offline={chat.offline}
        providerStates={chat.providerStates}
        selectedModel={chat.selectedModel}
        selectedModelId={chat.selectedModelId}
        voiceError={voice.error}
        voiceSettings={voice.settings}
        voiceStatus={voice.status}
        voiceSupport={voice.support}
        onGeminiApiKeyChange={chat.setGeminiApiKey}
        onModelChange={chat.setSelectedModelId}
        onUseSuggestion={chat.useSuggestion}
        onVoiceSettingChange={voice.updateSetting}
      />
    </div>
  );
}
