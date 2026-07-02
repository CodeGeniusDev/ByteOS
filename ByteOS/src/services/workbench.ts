import {
  Activity,
  Bot,
  BrainCircuit,
  Command,
  Database,
  Gauge,
  HardDrive,
  Keyboard,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Mic2,
  MonitorSmartphone,
  PanelLeft,
  RadioTower,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { WorkbenchPage } from "@/types/navigation";

export type NavItem = {
  id: WorkbenchPage;
  label: string;
  icon: LucideIcon;
};

export const navigationItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquareText },
  { id: "settings", label: "Settings", icon: Settings },
];

export const commandSuggestions = [
  { label: "Focus command bar", icon: Command },
  { label: "Search workspaces", icon: Search },
  { label: "Open sidebar", icon: PanelLeft },
];

export const systemMetrics = [
  { label: "Local shell", value: "Tauri", detail: "Native bridge", icon: MonitorSmartphone },
  { label: "Interface", value: "React", detail: "Workbench UI", icon: Sparkles },
  { label: "State", value: "Local", detail: "Session conversations", icon: Activity },
  { label: "Providers", value: "Ready", detail: "Ollama, Gemini, mock", icon: Database },
];

export const dashboardCards = [
  {
    title: "Assistant Surface",
    description: "A stable conversation workspace with history, markdown, retry, and streaming.",
    icon: Bot,
    status: "Chat ready",
  },
  {
    title: "Voice Layer",
    description: "Speech input, transcription preview, playback controls, and safe fallbacks.",
    icon: Mic2,
    status: "Voice ready",
  },
  {
    title: "Provider Routing",
    description: "Ollama and Gemini integration with automatic fallback to local mock responses.",
    icon: Workflow,
    status: "Fallback ready",
  },
];

export const activityItems = [
  { label: "Workbench shell", value: "Responsive layout", icon: Gauge },
  { label: "Visual language", value: "Dark glass system", icon: WandSparkles },
  { label: "Navigation", value: "Dashboard, Chat, Settings", icon: RadioTower },
  { label: "Project health", value: "Type-safe foundation", icon: ShieldCheck },
];

export const chatThreads = [
  { title: "System Design", subtitle: "App architecture notes", active: true },
  { title: "macOS Actions", subtitle: "Automation planning", active: false },
  { title: "Voice Console", subtitle: "Speech UX pass", active: false },
];

export const contextPanels = [
  { label: "Model Routing", value: "Not configured", icon: BrainCircuit },
  { label: "Memory Scope", value: "Local project", icon: HardDrive },
  { label: "Response Mode", value: "Workbench", icon: Zap },
];

export const settingsSections = [
  {
    title: "Appearance",
    description: "Native dark surface, compact controls, and soft glass panels.",
    icon: Sparkles,
    controls: ["Dark theme", "Reduce motion", "Compact density"],
  },
  {
    title: "Workspace",
    description: "Command bar behavior and sidebar preferences.",
    icon: Keyboard,
    controls: ["Floating sidebar", "Command hints", "Status strip"],
  },
  {
    title: "Privacy",
    description: "Local-first defaults for future assistant capabilities.",
    icon: LockKeyhole,
    controls: ["Local history", "Project memory", "Safe actions"],
  },
];

export const settingsControlDetails: Record<string, string> = {
  "Command hints": "Show command affordances in the top bar.",
  "Compact density": "Keep panels optimized for repeated desktop use.",
  "Dark theme": "Use the ByteOS dark palette across every surface.",
  "Floating sidebar": "Keep primary navigation in the glass sidebar shell.",
  "Local history": "Keep conversations in the current app session.",
  "Project memory": "Reserve memory controls for local workbench context.",
  "Reduce motion": "Prefer calmer transitions where supported.",
  "Safe actions": "Keep destructive actions explicit and recoverable.",
  "Status strip": "Show provider, voice, and workspace status cues.",
};

export const pageTitles: Record<WorkbenchPage, { title: string; eyebrow: string }> = {
  dashboard: { title: "Dashboard", eyebrow: "Command center" },
  chat: { title: "Chat", eyebrow: "Conversation surface" },
  settings: { title: "Settings", eyebrow: "Workbench controls" },
};
