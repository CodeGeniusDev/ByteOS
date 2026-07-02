import { useRef } from "react";
import { ImageIcon, Mic2, MicOff, Paperclip, SendHorizontal, Square, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedAttachment } from "@/types/chat";
import type { VoiceStatus } from "@/types/voice";

type ChatComposerProps = {
  attachments: UploadedAttachment[];
  draft: string;
  isGenerating: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  liveTranscript: string;
  voiceEnabled: boolean;
  voiceStatus: VoiceStatus;
  onAddFiles: (files: FileList | null) => void;
  onDraftChange: (draft: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onSendMessage: () => void;
  onStopSpeaking: () => void;
  onStopGeneration: () => void;
  onVoiceClick: () => void;
};

export function ChatComposer({
  attachments,
  draft,
  isGenerating,
  isListening,
  isSpeaking,
  liveTranscript,
  voiceEnabled,
  voiceStatus,
  onAddFiles,
  onDraftChange,
  onRemoveAttachment,
  onSendMessage,
  onStopSpeaking,
  onStopGeneration,
  onVoiceClick,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canSend = draft.trim().length > 0 && !isGenerating;
  const voiceButtonLabel = voiceStatus === "unsupported" ? "Voice unavailable" : "Voice";

  return (
    <form
      className="border-t border-border p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSendMessage();
      }}
    >
      <div className="rounded-2xl border border-border bg-muted/70 p-2">
        {attachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2 px-2 pt-2">
            {attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground"
              >
                <ImageIcon className="size-3.5 text-primary" />
                {attachment.name}
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(attachment.id)}
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) {
                onSendMessage();
              }
            }
          }}
          aria-label="Message draft"
          className="min-h-24 border-0 bg-transparent shadow-none focus:bg-transparent"
          placeholder="Message ByteOS local assistant"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              accept="image/*,.txt,.md,.json,.ts,.tsx,.js,.jsx"
              onChange={(event) => {
                onAddFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip />
              Attach
            </Button>
            <Button
              type="button"
              variant={isListening ? "secondary" : "ghost"}
              size="sm"
              onClick={onVoiceClick}
              aria-label={voiceButtonLabel}
              disabled={!voiceEnabled}
            >
              {isListening ? <MicOff /> : <Mic2 />}
              {isListening ? "Stop voice" : "Voice"}
            </Button>
            {isSpeaking ? (
              <Button type="button" variant="ghost" size="sm" onClick={onStopSpeaking}>
                <VolumeX />
                Stop speaking
              </Button>
            ) : null}
          </div>

          {isGenerating ? (
            <Button type="button" variant="secondary" size="sm" onClick={onStopGeneration}>
              <Square />
              Stop
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={!canSend}>
              <SendHorizontal />
              Send
            </Button>
          )}
        </div>
        {isListening || liveTranscript ? (
          <div className="mt-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-primary">
              {isListening ? "Listening" : "Transcript"}
            </span>
            {liveTranscript ? ` ${liveTranscript}` : " Speak now..."}
          </div>
        ) : null}
      </div>
    </form>
  );
}
