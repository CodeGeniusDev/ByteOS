"use client";

import { KeyRound, LockKeyhole, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/FormControls";
import { Panel } from "@/components/ui/Panel";
import type { AssistantConfig } from "@/types/byteos";

export function SettingsPanel({
  config,
  hasApiKey,
  onSaveSettings,
  onSetMode,
  onSaveApiKey,
  onOpenPrivacy
}: {
  config: AssistantConfig;
  hasApiKey: boolean;
  onSaveSettings: (config: Partial<AssistantConfig>) => void;
  onSetMode: (mode: "fast" | "balanced" | "deep") => void;
  onSaveApiKey: (apiKey: string) => void;
  onOpenPrivacy: () => void;
}) {
  const [draft, setDraft] = useState(config);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    setDraft(config);
  }, [config]);

  function update<K extends keyof AssistantConfig>(key: K, value: AssistantConfig[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid grid-cols-[1.2fr_0.8fr] gap-5 animate-fade-in">
      <Panel title="Model Settings" eyebrow="Runtime" className="row-span-2">
        <div className="grid gap-4">
          <Field label="Assistant name">
            <Input value={draft.assistant_name} onChange={(event) => update("assistant_name", event.target.value)} />
          </Field>
          <Field label="Model">
            <Input value={draft.model} onChange={(event) => update("model", event.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Temperature">
              <Input type="number" min={0} max={2} step={0.1} value={draft.temperature} onChange={(event) => update("temperature", Number(event.target.value))} />
            </Field>
            <Field label="Max output">
              <Input type="number" min={100} max={4000} value={draft.max_output_tokens} onChange={(event) => update("max_output_tokens", Number(event.target.value))} />
            </Field>
            <Field label="Timeout">
              <Input type="number" min={5} max={90} value={draft.api_timeout_seconds} onChange={(event) => update("api_timeout_seconds", Number(event.target.value))} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<SlidersHorizontal size={16} />} onClick={() => onSetMode("fast")}>Fast</Button>
            <Button icon={<SlidersHorizontal size={16} />} onClick={() => onSetMode("balanced")}>Balanced</Button>
            <Button icon={<SlidersHorizontal size={16} />} onClick={() => onSetMode("deep")}>Deep</Button>
            <Button variant="primary" icon={<Save size={16} />} onClick={() => onSaveSettings(draft)}>Save Settings</Button>
          </div>
        </div>
      </Panel>

      <Panel title="API Key" eyebrow="Local Secret">
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm text-workbench-muted">
            <LockKeyhole size={16} />
            {hasApiKey ? "A key is saved locally." : "No API key is loaded."}
          </div>
          <Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Paste Gemini API key" />
          <Button variant="primary" icon={<KeyRound size={16} />} onClick={() => onSaveApiKey(apiKey)}>Save API Key</Button>
        </div>
      </Panel>

      <Panel title="macOS Permissions" eyebrow="Control">
        <div className="grid gap-3 text-sm text-workbench-muted">
          <p>Grant Accessibility, Screen Recording, Microphone, and Automation so ByteOS can control apps and inspect your screen.</p>
          <Button icon={<ShieldCheck size={16} />} onClick={onOpenPrivacy}>Open Privacy Settings</Button>
        </div>
      </Panel>
    </div>
  );
}
