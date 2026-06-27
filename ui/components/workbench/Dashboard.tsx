import { AppWindow, Camera, Clipboard, Eye, Globe, NotebookTabs, Play, Square, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import type { ActivityItem, AppState } from "@/types/byteos";
import { ActivityLog } from "./ActivityLog";

const quickActions = [
  { label: "Safari", action: "open-app", value: "Safari", icon: AppWindow },
  { label: "Notes", action: "open-app", value: "Notes", icon: NotebookTabs },
  { label: "Apple", action: "open-url", value: "apple.com", icon: Globe },
  { label: "Active App", action: "active-app", value: "", icon: TerminalSquare },
  { label: "Screenshot", action: "screenshot", value: "", icon: Camera },
  { label: "See Screen", action: "see-screen", value: "", icon: Eye },
  { label: "Copy Status", action: "copy", value: "ByteOS is running.", icon: Clipboard }
];

export function Dashboard({
  state,
  activity,
  onRunAction,
  onClearActivity,
  onSetMode
}: {
  state: AppState;
  activity: ActivityItem[];
  onRunAction: (action: string, value?: string) => void;
  onClearActivity: () => void;
  onSetMode: (mode: "fast" | "balanced" | "deep") => void;
}) {
  const openTodos = state.memory.todos.filter((todo) => !todo.done).length;
  return (
    <div className="grid gap-5 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        <Panel title="AI Mode" eyebrow="Model">
          <p className="text-2xl font-semibold">{state.config.response_mode}</p>
          <p className="mt-1 text-sm text-workbench-muted">{state.config.model}</p>
        </Panel>
        <Panel title="Memory" eyebrow="Context">
          <p className="text-2xl font-semibold">{state.memory.facts.length}</p>
          <p className="mt-1 text-sm text-workbench-muted">saved facts</p>
        </Panel>
        <Panel title="Todos" eyebrow="Tasks">
          <p className="text-2xl font-semibold">{openTodos}</p>
          <p className="mt-1 text-sm text-workbench-muted">open items</p>
        </Panel>
        <Panel title="API" eyebrow="Connection">
          <p className="text-2xl font-semibold">{state.hasApiKey ? "Ready" : "Missing"}</p>
          <p className="mt-1 text-sm text-workbench-muted">Gemini key</p>
        </Panel>
      </div>

      <div className="grid grid-cols-[1.3fr_0.7fr] gap-5">
        <Panel title="Command Center" eyebrow="Quick Actions">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onRunAction(item.action, item.value)}
                  className="grid min-h-24 place-items-center gap-2 rounded-workbench border border-workbench-line bg-workbench-panel2 p-3 text-sm transition hover:border-workbench-accent"
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Feature Controls" eyebrow="Assistant">
          <div className="grid gap-3">
            <Button variant="primary" icon={<Play size={16} />} onClick={() => onSetMode("fast")}>Start Fast Mode</Button>
            <Button icon={<Square size={16} />} onClick={() => onSetMode("balanced")}>Balanced Mode</Button>
            <Button variant="ghost" onClick={() => onSetMode("deep")}>Deep Planning Mode</Button>
          </div>
        </Panel>
      </div>

      <ActivityLog activity={activity} onClear={onClearActivity} />
    </div>
  );
}
