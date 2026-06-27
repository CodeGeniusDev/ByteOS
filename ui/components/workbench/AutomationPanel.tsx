"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Panel } from "@/components/ui/Panel";
import type { Automation } from "@/types/byteos";

export function AutomationPanel({
  automations,
  onSave
}: {
  automations: Automation[];
  onSave: (automations: Automation[]) => void;
}) {
  function update(index: number, patch: Partial<Automation>) {
    onSave(automations.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function addAutomation() {
    onSave([
      ...automations,
      {
        id: crypto.randomUUID(),
        name: "Reminder",
        kind: "speak",
        payload: "This is your ByteOS reminder.",
        intervalMinutes: 30,
        enabled: false
      }
    ]);
  }

  function removeAutomation(index: number) {
    onSave(automations.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <Panel
      title="Automation Controls"
      eyebrow="Local Tasks"
      action={<Button variant="primary" icon={<Plus size={16} />} onClick={addAutomation}>Add</Button>}
      className="animate-fade-in"
    >
      <div className="grid gap-3">
        {automations.length === 0 && (
          <p className="rounded-workbench border border-dashed border-workbench-line p-6 text-sm text-workbench-muted">
            No automations yet. Add a local reminder or URL opener, then start it from here.
          </p>
        )}
        {automations.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-workbench border border-workbench-line bg-[#101720] p-4">
            <div className="grid grid-cols-[1fr_150px_120px_auto] gap-3">
              <Input value={item.name} onChange={(event) => update(index, { name: event.target.value })} />
              <select
                className="h-10 rounded-workbench border border-workbench-line bg-workbench-panel2 px-3 text-sm"
                value={item.kind}
                onChange={(event) => update(index, { kind: event.target.value as Automation["kind"] })}
              >
                <option value="speak">Speak</option>
                <option value="open-url">Open URL</option>
              </select>
              <Input
                type="number"
                min={1}
                value={item.intervalMinutes}
                onChange={(event) => update(index, { intervalMinutes: Number(event.target.value) })}
              />
              <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => removeAutomation(index)}>Remove</Button>
            </div>
            <Input value={item.payload} onChange={(event) => update(index, { payload: event.target.value })} />
            <div className="flex items-center justify-between">
              <p className="text-sm text-workbench-muted">Runs every {item.intervalMinutes} minutes while ByteOS is open.</p>
              <Button variant={item.enabled ? "secondary" : "primary"} onClick={() => update(index, { enabled: !item.enabled })}>
                {item.enabled ? "Stop" : "Start"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
