import ReactMarkdown from "react-markdown";
import { Bot, Check, Clipboard, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  copiedMessageId: string | null;
  isLastAssistantMessage: boolean;
  message: ChatMessage;
  onCopyCode: (code: string) => void;
  onCopyMessage: (message: ChatMessage) => void;
  onRetryResponse: () => void;
};

export function MessageBubble({
  copiedMessageId,
  isLastAssistantMessage,
  message,
  onCopyCode,
  onCopyMessage,
  onRetryResponse,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const Icon = isUser ? UserRound : Bot;

  return (
    <div className={cn("group flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? <MessageAvatar icon={Icon} tone="assistant" /> : null}

      <div className={cn("max-w-[min(42rem,84%)]", isUser && "order-first")}>
        <div
          className={cn(
            "rounded-2xl border p-4 shadow-[0_18px_48px_rgba(0,0,0,.18)]",
            isUser
              ? "border-primary/25 bg-primary/14"
              : "border-border bg-secondary/78 backdrop-blur-xl",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              {isUser ? "You" : "ByteOS"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
              onClick={() => onCopyMessage(message)}
              aria-label="Copy message"
            >
              {copiedMessageId === message.id ? <Check /> : <Clipboard />}
            </Button>
          </div>

          <ReactMarkdown
            components={{
              code({ children, className }) {
                const code = String(children).replace(/\n$/, "");
                const isBlock = Boolean(className);

                if (!isBlock) {
                  return (
                    <code className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[0.85em] text-primary">
                      {children}
                    </code>
                  );
                }

                return (
                  <span className="relative mt-3 block overflow-hidden rounded-2xl border border-border bg-background/82">
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-10 inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-card/90 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => onCopyCode(code)}
                    >
                      <Clipboard className="size-3.5" />
                      Copy
                    </button>
                    <code className="block overflow-x-auto p-4 pt-11 font-mono text-xs leading-6 text-[#FFFCF2]">
                      {code}
                    </code>
                  </span>
                );
              },
              p({ children }) {
                return <p className="mb-3 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {!isUser && isLastAssistantMessage ? (
          <div className="mt-2 flex justify-start">
            <Button type="button" variant="ghost" size="sm" onClick={onRetryResponse}>
              <RefreshCw />
              Retry
            </Button>
          </div>
        ) : null}
      </div>

      {isUser ? <MessageAvatar icon={Icon} tone="user" /> : null}
    </div>
  );
}

function MessageAvatar({
  icon: Icon,
  tone,
}: {
  icon: typeof Bot;
  tone: "assistant" | "user";
}) {
  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-2xl",
        tone === "assistant" ? "bg-primary/14 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
