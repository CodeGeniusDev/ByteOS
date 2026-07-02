import { useEffect, useRef } from "react";
import { Loader2, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { promptSuggestions } from "@/services/chat";
import type { ChatMessage } from "@/types/chat";
import { MessageBubble } from "@/components/chat/message-bubble";

type MessageListProps = {
  copiedMessageId: string | null;
  isGenerating: boolean;
  messages: ChatMessage[];
  onCopyCode: (code: string) => void;
  onCopyMessage: (message: ChatMessage) => void;
  onRetryResponse: () => void;
  onUseSuggestion: (suggestion: string) => void;
};

export function MessageList({
  copiedMessageId,
  isGenerating,
  messages,
  onCopyCode,
  onCopyMessage,
  onRetryResponse,
  onUseSuggestion,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantMessageId = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isGenerating, messages]);

  return (
    <ScrollArea className="min-h-0">
      <div className="grid gap-4 p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-border bg-muted/35 p-6 text-center">
            <div className="max-w-lg">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary/14 text-primary">
                <MessageSquareText className="size-7" />
              </div>
              <h2 className="text-xl font-semibold">Start a new ByteOS conversation</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use a suggestion or write a prompt. Responses are generated locally with a safe
                mock assistant until real providers are connected.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {promptSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onUseSuggestion(suggestion)}
                  >
                    <Sparkles />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            copiedMessageId={copiedMessageId}
            isLastAssistantMessage={message.id === lastAssistantMessageId}
            message={message}
            onCopyCode={onCopyCode}
            onCopyMessage={onCopyMessage}
            onRetryResponse={onRetryResponse}
          />
        ))}

        {isGenerating ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/14 text-primary">
              <Loader2 className="size-5 animate-spin" />
            </div>
            ByteOS is drafting a local response...
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
