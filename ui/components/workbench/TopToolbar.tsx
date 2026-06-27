import { Loader2, Mic, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { WorkbenchView } from "./Sidebar";

const titles: Record<WorkbenchView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Operate ByteOS from one professional control surface."
  },
  chat: {
    title: "Chat",
    subtitle: "Ask questions and issue natural Mac instructions."
  },
  controls: {
    title: "Mac Control",
    subtitle: "Open apps, inspect the screen, and control the active workspace."
  },
  automations: {
    title: "Automations",
    subtitle: "Manage local tasks that ByteOS can run for you."
  },
  memory: {
    title: "Memory",
    subtitle: "Curate facts, todos, notes, and long-term assistant context."
  },
  files: {
    title: "Files",
    subtitle: "Import, preview, rename, delete, and analyze local files."
  },
  voice: {
    title: "Voice",
    subtitle: "Control microphone input and macOS text-to-speech output."
  },
  settings: {
    title: "Settings",
    subtitle: "Tune models, speed, permissions, and local configuration."
  },
  developer: {
    title: "Developer",
    subtitle: "Inspect bridge status, configuration, and diagnostics."
  },
  logs: {
    title: "Logs",
    subtitle: "Review persisted runtime events."
  }
};

export function TopToolbar({
  activeView,
  isBusy,
  onRefresh,
  onVoice,
  onPrivacy
}: {
  activeView: WorkbenchView;
  isBusy: boolean;
  onRefresh: () => void;
  onVoice: () => void;
  onPrivacy: () => void;
}) {
  const copy = titles[activeView];
  return (
    <header className="flex h-[86px] items-center justify-between border-b border-workbench-line bg-workbench-bg/95 px-7 backdrop-blur">
      <div>
        <h2 className="text-xl font-semibold text-workbench-text">{copy.title}</h2>
        <p className="mt-1 text-sm text-workbench-muted">{copy.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onPrivacy} icon={<ShieldCheck size={16} />}>
          Permissions
        </Button>
        <Button variant="secondary" onClick={onRefresh} icon={isBusy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}>
          Refresh
        </Button>
        <Button variant="primary" onClick={onVoice} icon={<Mic size={16} />}>
          Voice
        </Button>
      </div>
    </header>
  );
}
