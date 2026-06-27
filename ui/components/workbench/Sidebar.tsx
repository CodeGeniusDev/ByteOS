import type { ComponentType } from "react";
import {
  Bot,
  Brain,
  Code2,
  Cpu,
  Files,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  Mic2,
  ScrollText,
  Settings,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type WorkbenchView =
  | "dashboard"
  | "chat"
  | "controls"
  | "automations"
  | "memory"
  | "files"
  | "voice"
  | "settings"
  | "developer"
  | "logs";

const items: Array<{ id: WorkbenchView; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "controls", label: "Mac Control", icon: Cpu },
  { id: "automations", label: "Automation", icon: Zap },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "files", label: "Files", icon: Files },
  { id: "voice", label: "Voice", icon: Mic2 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "developer", label: "Developer", icon: Code2 },
  { id: "logs", label: "Logs", icon: ScrollText }
];

export function Sidebar({
  activeView,
  onViewChange,
  hasApiKey,
  mode,
  collapsed,
  onToggle
}: {
  activeView: WorkbenchView;
  onViewChange: (view: WorkbenchView) => void;
  hasApiKey: boolean;
  mode: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 292 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="relative flex min-h-screen shrink-0 flex-col border-r border-white/10 bg-[#080c12]/85 p-4 backdrop-blur-2xl"
    >
      <button
        onClick={onToggle}
        className="mb-6 flex h-12 items-center gap-3 rounded-2xl px-2 text-left transition hover:bg-white/[0.04]"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-lg font-black text-slate-950 shadow-[0_0_24px_rgba(87,216,255,.26)]">
          B
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold text-white">ByteOS</h1>
            <p className="truncate text-xs text-slate-400">AI Workbench</p>
          </div>
        )}
      </button>

      <nav className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex h-11 items-center gap-3 rounded-2xl px-3 text-sm transition",
                collapsed && "justify-center px-0",
                active
                  ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]"
                  : "text-slate-400 hover:bg-white/[0.045] hover:text-white"
              )}
            >
              {active && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-cyan-300" />}
              <Icon size={18} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className={cn("rounded-3xl border border-white/10 bg-white/[0.045] p-3", collapsed && "p-2")}>
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <span className={cn("size-2.5 rounded-full", hasApiKey ? "bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.8)]" : "bg-rose-400")} />
            {!collapsed && <span className="text-xs font-medium text-slate-300">{hasApiKey ? "Ready" : "Needs key"}</span>}
          </div>
          {!collapsed && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Gauge size={14} />
              <span className="capitalize">{mode} mode</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-3 flex items-center gap-2 px-2 text-[11px] text-slate-600">
            <Bot size={13} />
            <span>Local desktop runtime</span>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
