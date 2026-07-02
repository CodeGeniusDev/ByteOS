import {
  BrainCircuit,
  CloudOff,
  FileText,
  KeyRound,
  Mic2,
  ShieldCheck,
  Volume2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { aiProviderModels } from "@/services/ai-providers";
import { promptSuggestions } from "@/services/chat";
import type { AiProviderModel, AiProviderState } from "@/types/ai";
import type { VoiceSettings, VoiceStatus } from "@/types/voice";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { voiceStatusLabel } from "@/services/voice";

type ChatContextPanelProps = {
  activeProviderLabel: string;
  geminiApiKey: string;
  messageCount: number;
  offline: boolean;
  providerStates: AiProviderState[];
  selectedModel: AiProviderModel;
  selectedModelId: string;
  voiceError: string | null;
  voiceSettings: VoiceSettings;
  voiceStatus: VoiceStatus;
  voiceSupport: {
    recognition: boolean;
    synthesis: boolean;
  };
  onGeminiApiKeyChange: (apiKey: string) => void;
  onModelChange: (modelId: string) => void;
  onUseSuggestion: (suggestion: string) => void;
  onVoiceSettingChange: <Key extends keyof VoiceSettings>(
    key: Key,
    value: VoiceSettings[Key],
  ) => void;
};

export function ChatContextPanel({
  activeProviderLabel,
  geminiApiKey,
  messageCount,
  offline,
  providerStates,
  selectedModel,
  selectedModelId,
  voiceError,
  voiceSettings,
  voiceStatus,
  voiceSupport,
  onGeminiApiKeyChange,
  onModelChange,
  onUseSuggestion,
  onVoiceSettingChange,
}: ChatContextPanelProps) {
  return (
    <Card className="xl:min-h-full">
      <CardHeader>
        <CardTitle>Provider Controls</CardTitle>
        <CardDescription>Streaming providers with safe local fallback.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <label className="grid gap-2 rounded-2xl border border-border bg-muted/60 p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <BrainCircuit className="size-4 text-primary" />
            Provider Model
          </span>
          <select
            value={selectedModelId}
            onChange={(event) => onModelChange(event.target.value)}
            className="h-10 rounded-xl border border-input bg-background/80 px-3 text-sm text-foreground"
          >
            {aiProviderModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{selectedModel.description}</span>
        </label>

        <label className="grid gap-2 rounded-2xl border border-border bg-muted/60 p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4 text-primary" />
            Gemini API Key
          </span>
          <Input
            value={geminiApiKey}
            onChange={(event) => onGeminiApiKeyChange(event.target.value)}
            placeholder="Use VITE_GEMINI_API_KEY or paste for this session"
            type="password"
            aria-label="Gemini API key"
          />
          <span className="text-xs text-muted-foreground">
            Stored only in this app session; never logged by ByteOS.
          </span>
        </label>

        <div className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" />
              Provider Status
            </span>
            <Badge variant={offline ? "secondary" : "default"}>
              {offline ? <CloudOff className="size-3.5" /> : null}
              {offline ? "Offline" : activeProviderLabel}
            </Badge>
          </div>
          <div className="grid gap-2">
            {providerStates.map((provider) => (
              <div
                key={provider.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-secondary/60 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{provider.label}</p>
                  <p className="text-xs text-muted-foreground">{provider.detail}</p>
                </div>
                <span
                  className={cn(
                    "mt-1 size-2.5 rounded-full",
                    provider.status === "ready" && "bg-primary",
                    provider.status === "checking" && "bg-muted-foreground",
                    provider.status !== "ready" &&
                      provider.status !== "checking" &&
                      "bg-muted-foreground/45",
                  )}
                  aria-label={`${provider.label} ${provider.status}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Mic2 className="size-4 text-primary" />
              Voice Assistant
            </span>
            <Badge variant={voiceStatus === "listening" || voiceStatus === "speaking" ? "default" : "secondary"}>
              {voiceStatusLabel(voiceStatus)}
            </Badge>
          </div>
          <div className="grid gap-3">
            <VoiceToggle
              checked={voiceSettings.enabled}
              label="Enable voice"
              onCheckedChange={(checked) => onVoiceSettingChange("enabled", checked)}
            />
            <VoiceToggle
              checked={voiceSettings.pushToTalk}
              label="Push-to-talk"
              onCheckedChange={(checked) => onVoiceSettingChange("pushToTalk", checked)}
            />
            <VoiceToggle
              checked={voiceSettings.autoSend}
              label="Auto-send spoken prompt"
              onCheckedChange={(checked) => onVoiceSettingChange("autoSend", checked)}
            />
            <VoiceToggle
              checked={voiceSettings.speakReplies}
              label="Speak AI replies"
              onCheckedChange={(checked) => onVoiceSettingChange("speakReplies", checked)}
            />
          </div>
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
            <p>
              Recognition: {voiceSupport.recognition ? "available" : "unsupported fallback"}
            </p>
            <p>Text-to-speech: {voiceSupport.synthesis ? "available" : "unsupported fallback"}</p>
            {voiceError ? <p className="text-destructive">{voiceError}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Zap className="size-4 text-primary" />
            Prompt Suggestions
          </div>
          <div className="grid gap-2">
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-xl border border-border bg-secondary/70 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                onClick={() => onUseSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <StatusTile icon={ShieldCheck} label="Active provider" value={activeProviderLabel} />
          <StatusTile icon={FileText} label="Messages" value={`${messageCount}`} />
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
            <Badge>Safe fallback</Badge>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Ollama and Gemini stream when available. ByteOS falls back to local mock responses
              without crashing.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VoiceToggle({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/60 px-3 py-2">
      <span className="flex items-center gap-2 text-sm">
        <Volume2 className="size-3.5 text-primary" />
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/60 p-4">
      <Icon className="mb-4 size-5 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
