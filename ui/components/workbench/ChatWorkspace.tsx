"use client";

import { FormEvent, useRef, useState } from "react";
import { Bot, Mic, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/FormControls";
import type { ChatMessage } from "@/types/byteos";
import { cn } from "@/lib/cn";

export function ChatWorkspace({
  history,
  isBusy,
  onSend,
  onVoice
}: {
  history: ChatMessage[];
  isBusy: boolean;
  onSend: (message: string) => void;
  onVoice: () => void;
}) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isBusy) return;
    setMessage("");
    onSend(trimmed);
    textareaRef.current?.focus();
  }

  return (
    <div className="grid h-[calc(100vh-134px)] grid-rows-[1fr_auto] gap-4 animate-fade-in">
      <div className="overflow-auto rounded-workbench border border-workbench-line bg-workbench-panel p-4">
        <div className="mx-auto grid max-w-4xl gap-3">
          {history.length === 0 && (
            <div className="rounded-workbench border border-dashed border-workbench-line p-8 text-center">
              <Bot className="mx-auto mb-3 text-workbench-accent" size={34} />
              <h3 className="text-lg font-semibold">Start a ByteOS session</h3>
              <p className="mt-2 text-sm text-workbench-muted">
                Ask a question, or type a Mac instruction like open Safari, take screenshot, or what is on my screen.
              </p>
            </div>
          )}

          {history.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={cn(
                "flex gap-3 rounded-workbench border p-4 animate-slide-up",
                item.role === "user"
                  ? "ml-auto max-w-[82%] border-workbench-blue/30 bg-workbench-blue/10"
                  : "mr-auto max-w-[82%] border-workbench-line bg-[#101720]"
              )}
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-workbench bg-workbench-panel2">
                {item.role === "user" ? <UserRound size={16} /> : <Bot size={16} />}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-workbench-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="rounded-workbench border border-workbench-line bg-workbench-panel p-3 shadow-soft">
        <div className="grid grid-cols-[auto_1fr_auto] items-end gap-3">
          <Button type="button" variant="ghost" onClick={onVoice} icon={<Mic size={16} />}>
            Voice
          </Button>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask ByteOS anything, or type: open Safari"
            className="min-h-16"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(event);
              }
            }}
          />
          <Button type="submit" variant="primary" disabled={isBusy} icon={<Send size={16} />}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
