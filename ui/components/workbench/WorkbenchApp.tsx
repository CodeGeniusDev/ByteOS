"use client";

import { FormEvent, ReactNode, useMemo, useRef, useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import { AnimatePresence, motion } from "framer-motion";
import {
  AppWindow,
  Battery,
  Bluetooth,
  Bot,
  Brain,
  Camera,
  Check,
  Clipboard,
  Code2,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  History,
  ImageIcon,
  Keyboard,
  Lock,
  Mic,
  Moon,
  MoreHorizontal,
  Paperclip,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Square,
  TerminalSquare,
  Trash2,
  Upload,
  Volume2,
  Wifi,
  Zap,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/FormControls";
import { cn } from "@/lib/cn";
import { useByteOS, type ByteOSController } from "@/lib/useByteOS";
import type { ActivityItem, Automation, ChatMessage, MemoryState, WorkbenchFile } from "@/types/byteos";
import { Sidebar, type WorkbenchView } from "./Sidebar";

const viewTitles: Record<WorkbenchView, { title: string; subtitle: string }> = {
  dashboard: { title: "Command Workspace", subtitle: "Your live control surface for AI, Mac actions, memory, files, and automations." },
  chat: { title: "Assistant Chat", subtitle: "Ask questions, control your Mac, attach files, and keep the session moving." },
  controls: { title: "Mac Control", subtitle: "Launch apps, inspect system state, capture screen context, and run safe desktop actions." },
  automations: { title: "Automation Studio", subtitle: "Create scheduled voice or website actions with runtime logs and enable switches." },
  memory: { title: "Memory", subtitle: "Curate the facts, notes, todos, and priorities your assistant should remember." },
  files: { title: "Files", subtitle: "Import local files, preview details, rename, delete, and ask AI to analyze them." },
  voice: { title: "Voice", subtitle: "Push-to-talk, hands-free listening, live transcription, and local macOS speech output." },
  settings: { title: "Settings", subtitle: "Models, API keys, appearance, permissions, voice, backup, and runtime preferences." },
  developer: { title: "Developer", subtitle: "Inspect bridge status, configuration, and local desktop runtime diagnostics." },
  logs: { title: "Logs", subtitle: "Review and clear persisted activity from the local Electron runtime." }
};

const macActions = [
  { label: "Safari", action: "open-app", value: "Safari", icon: Globe },
  { label: "Notes", action: "open-app", value: "Notes", icon: FileText },
  { label: "Finder", action: "open-app", value: "Finder", icon: FolderOpen },
  { label: "Terminal", action: "open-app", value: "Terminal", icon: TerminalSquare },
  { label: "Screenshot", action: "screenshot", value: "", icon: Camera },
  { label: "See Screen", action: "see-screen", value: "", icon: Eye },
  { label: "Clipboard", action: "read-clipboard", value: "", icon: Clipboard },
  { label: "Active App", action: "active-app", value: "", icon: AppWindow }
];

function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-[#101722]/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-4 truncate text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 truncate text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function formatTime(value?: string) {
  if (!value) return "now";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function WorkbenchMarkdown({ text }: { text: string }) {
  const blocks = text.split(/```/g);
  return (
    <div className="space-y-3 text-sm leading-6">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          const [, ...lines] = block.split("\n");
          const code = lines.join("\n").trim() || block.trim();
          return (
            <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-slate-500">
                <span>Code</span>
                <button onClick={() => navigator.clipboard?.writeText(code)} className="text-slate-300 hover:text-white">Copy</button>
              </div>
              <pre className="overflow-auto p-3 text-xs text-cyan-100"><code>{code}</code></pre>
            </div>
          );
        }
        return <p key={index} className="whitespace-pre-wrap text-slate-200">{block}</p>;
      })}
    </div>
  );
}

export function WorkbenchApp() {
  const [activeView, setActiveView] = useState<WorkbenchView>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const controller = useByteOS();
  const [voiceState, setVoiceState] = useState({ listening: false, speaking: false, transcript: "", error: "", handsFree: false, volume: 70 });
  const recognitionRef = useRef<any>(null);

  function speak(text: string) {
    if (!text.trim()) return;
    setVoiceState((current) => ({ ...current, speaking: true }));
    void controller.runMacAction("speak", text).finally(() => setVoiceState((current) => ({ ...current, speaking: false })));
  }

  function stopSpeaking() {
    setVoiceState((current) => ({ ...current, speaking: false }));
    void controller.runMacAction("stop-speaking");
  }

  function startVoice(handsFree = false) {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      setVoiceState((current) => ({ ...current, error: "Speech recognition is not available in this Electron runtime." }));
      void controller.runMacAction("speak", "Voice input is not available in this app runtime.");
      return;
    }
    recognitionRef.current?.stop?.();
    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.continuous = handsFree;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceState((current) => ({ ...current, listening: true, error: "", handsFree }));
    recognition.onerror = (event: any) => setVoiceState((current) => ({ ...current, listening: false, error: event?.error || "Microphone permission failed." }));
    recognition.onend = () => setVoiceState((current) => ({ ...current, listening: false }));
    recognition.onresult = (event: any) => {
      const result = Array.from(event.results).map((item: any) => item[0]?.transcript || "").join(" ").trim();
      setVoiceState((current) => ({ ...current, transcript: result }));
      const finalResult = event.results[event.results.length - 1];
      if (finalResult?.isFinal && result) void controller.sendChat(result);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop?.();
    setVoiceState((current) => ({ ...current, listening: false, handsFree: false }));
  }

  const latestReply = [...controller.state.history].reverse().find((item) => item.role === "model")?.text || "ByteOS is ready.";
  const currentTitle = viewTitles[activeView];

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0f14] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(67,226,255,.12),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(142,93,255,.14),transparent_30%),linear-gradient(180deg,#0b0f14,#101722_48%,#0b0f14)]" />
      <div className="relative flex min-h-screen">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          hasApiKey={controller.state.hasApiKey}
          mode={controller.state.config.response_mode}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
        <main className="grid min-w-0 flex-1 grid-rows-[auto_1fr_auto]">
          <header className="flex min-h-20 items-center justify-between border-b border-white/10 bg-[#0b0f14]/65 px-6 backdrop-blur-xl">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold tracking-[-0.01em] text-white">{currentTitle.title}</h2>
              <p className="mt-1 truncate text-sm text-slate-400">{currentTitle.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <CommandSearch onSend={controller.sendChat} />
              <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={controller.refresh} disabled={controller.isBusy}>Refresh</Button>
              <Button variant="primary" icon={<Mic size={16} />} onClick={() => startVoice(false)} disabled={voiceState.listening}>Voice</Button>
            </div>
          </header>

          <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-5 overflow-hidden p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="min-h-0 overflow-auto pr-1"
              >
                {activeView === "dashboard" && <DashboardView controller={controller} onViewChange={setActiveView} />}
                {activeView === "chat" && <ChatView controller={controller} onVoice={() => startVoice(false)} speak={speak} />}
                {activeView === "controls" && <MacControlView controller={controller} />}
                {activeView === "automations" && <AutomationView controller={controller} />}
                {activeView === "memory" && <MemoryView controller={controller} />}
                {activeView === "files" && <FilesView controller={controller} />}
                {activeView === "voice" && (
                  <VoiceView
                    voiceState={voiceState}
                    setVoiceState={setVoiceState}
                    startVoice={startVoice}
                    stopVoice={stopVoice}
                    speak={() => speak(latestReply)}
                    stopSpeaking={stopSpeaking}
                  />
                )}
                {activeView === "settings" && <SettingsView controller={controller} />}
                {activeView === "developer" && <DeveloperView controller={controller} />}
                {activeView === "logs" && <LogsView controller={controller} />}
              </motion.div>
            </AnimatePresence>
            <AssistantPanel controller={controller} latestReply={latestReply} speak={speak} stopSpeaking={stopSpeaking} voiceState={voiceState} />
          </section>

          <StatusBar controller={controller} voiceState={voiceState} />
        </main>
      </div>
    </div>
  );
}

function CommandSearch({ onSend }: { onSend: (message: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onSend(value);
        setValue("");
      }}
      className="hidden h-11 w-[360px] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-sm md:flex"
    >
      <Search size={16} className="text-slate-500" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Command ByteOS..."
        className="min-w-0 flex-1 bg-transparent text-slate-200 outline-none placeholder:text-slate-600"
      />
      <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">↵</kbd>
    </form>
  );
}

function DashboardView({ controller, onViewChange }: { controller: ByteOSController; onViewChange: (view: WorkbenchView) => void }) {
  const openTodos = controller.state.memory.todos.filter((todo) => !todo.done).length;
  const recentFiles = controller.state.files.slice(0, 4);
  return (
    <div className="grid gap-5">
      <GlassPanel className="overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200"><Sparkles size={22} /></span>
              <div>
                <p className="text-sm text-slate-400">Assistant Status</p>
                <h3 className="text-3xl font-semibold tracking-[-0.03em] text-white">{controller.state.hasApiKey ? "Ready to work" : "Connect a free Gemini key"}</h3>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Mode" value={controller.state.config.response_mode} detail={controller.state.config.model} />
              <Metric label="Memory" value={controller.state.memory.facts.length + controller.state.memory.notes.length} detail="saved items" />
              <Metric label="Tasks" value={openTodos} detail="open todos" />
              <Metric label="Files" value={controller.state.files.length} detail="local imports" />
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Today</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Mode: <span className="text-white">{controller.state.config.response_mode}</span></p>
              <p>Recent messages: <span className="text-white">{controller.state.history.length}</span></p>
              <p>Automations enabled: <span className="text-white">{controller.state.automations.filter((item) => item.enabled).length}</span></p>
              <p>Runtime events: <span className="text-white">{controller.state.logs.length + controller.activity.length}</span></p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <GlassPanel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Commands</p>
              <h3 className="mt-1 text-lg font-semibold">Pinned Tools</h3>
            </div>
            <Button variant="ghost" icon={<MoreHorizontal size={16} />} onClick={() => onViewChange("controls")}>More</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {macActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => void controller.runMacAction(item.action, item.value)}
                  className="group grid min-h-28 content-center justify-items-start rounded-[22px] border border-white/10 bg-[#111827]/75 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-[#152033]"
                >
                  <Icon size={20} className="mb-4 text-cyan-200" />
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </button>
              );
            })}
          </div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Running Tasks</p>
          <div className="mt-4 space-y-3">
            {controller.state.automations.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500">Every {item.intervalMinutes} min</p>
                </div>
                <span className={cn("size-2.5 rounded-full", item.enabled ? "bg-cyan-300" : "bg-slate-600")} />
              </div>
            ))}
            {controller.state.automations.length === 0 && <EmptyLine icon={<Zap size={16} />} text="No automations yet." />}
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Timeline activity={controller.activity} />
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent Files</p>
          <div className="mt-4 space-y-2">
            {recentFiles.map((file) => <FileRow key={file.name} file={file} onOpen={() => void window.byteos?.openFile(file.path)} />)}
            {recentFiles.length === 0 && <EmptyLine icon={<Upload size={16} />} text="Import files to analyze them with ByteOS." />}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function ChatView({ controller, onVoice, speak }: { controller: ByteOSController; onVoice: () => void; speak: (text: string) => void }) {
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const filtered = controller.state.history.filter((item) => item.text.toLowerCase().includes(query.toLowerCase()));

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || controller.isBusy) return;
    setMessage("");
    setEditing(null);
    void controller.sendChat(trimmed);
    inputRef.current?.focus();
  }

  return (
    <div className="grid h-full min-h-[680px] grid-rows-[auto_1fr_auto] gap-4">
      <GlassPanel className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-2xl bg-black/20 px-3">
          <Search size={16} className="text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversation" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
        </div>
        <Button variant="ghost" icon={<Paperclip size={16} />} onClick={controller.importFiles}>Attach</Button>
        <Button variant="ghost" icon={<Download size={16} />} onClick={controller.exportChat}>Export</Button>
        <Button variant="primary" icon={<Mic size={16} />} onClick={onVoice}>Voice</Button>
      </GlassPanel>

      <GlassPanel className="min-h-0 overflow-auto p-5">
        <div className="mx-auto max-w-4xl space-y-4">
          {filtered.length === 0 && <EmptyState title="Start a focused session" text="Ask anything, or type a Mac instruction like open Safari, take screenshot, or see screen." icon={<Bot size={26} />} />}
          {filtered.map((item, index) => (
            <motion.div
              key={`${item.role}-${index}-${item.text.slice(0, 8)}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("group flex gap-3", item.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn("max-w-[82%] rounded-[26px] border p-4", item.role === "user" ? "border-cyan-300/20 bg-cyan-300/10" : "border-white/10 bg-[#111827]/85")}>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{item.role === "user" ? "You" : "ByteOS"} · {formatTime(item.at)}</span>
                  <div className="flex opacity-0 transition group-hover:opacity-100">
                    <button className="p-1 hover:text-white" onClick={() => navigator.clipboard?.writeText(item.text)} title="Copy"><Copy size={14} /></button>
                    {item.role === "user" && <button className="p-1 hover:text-white" onClick={() => { setMessage(item.text); setEditing(index); }} title="Edit"><Edit3 size={14} /></button>}
                    {item.role === "model" && <button className="p-1 hover:text-white" onClick={() => speak(item.text)} title="Speak"><Volume2 size={14} /></button>}
                    {item.role === "user" && <button className="p-1 hover:text-white" onClick={() => void controller.sendChat(item.text)} title="Retry"><RefreshCw size={14} /></button>}
                  </div>
                </div>
                <WorkbenchMarkdown text={item.text} />
              </div>
            </motion.div>
          ))}
          {controller.isBusy && <div className="flex items-center gap-2 text-sm text-cyan-200"><span className="size-2 animate-pulse rounded-full bg-cyan-300" /> ByteOS is thinking...</div>}
        </div>
      </GlassPanel>

      <form onSubmit={submit} className="rounded-[30px] border border-white/10 bg-[#111827]/90 p-3 shadow-[0_20px_80px_rgba(0,0,0,.3)]">
        {editing !== null && <div className="mb-2 flex items-center justify-between rounded-2xl bg-amber-300/10 px-3 py-2 text-xs text-amber-100">Editing previous prompt <button onClick={() => setEditing(null)} type="button"><X size={14} /></button></div>}
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Textarea
            ref={inputRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message ByteOS, attach files, or command your Mac..."
            className="min-h-[72px] border-transparent bg-transparent"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(event);
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button type="button" variant="ghost" icon={<Mic size={16} />} onClick={onVoice} />
            <Button type="submit" variant="primary" icon={<Send size={16} />} disabled={controller.isBusy || !message.trim()} />
          </div>
        </div>
      </form>
    </div>
  );
}

function MacControlView({ controller }: { controller: ByteOSController }) {
  const [appName, setAppName] = useState("Safari");
  const [url, setUrl] = useState("apple.com");
  const [text, setText] = useState("");
  const [spotlight, setSpotlight] = useState("calculator");
  const [volume, setVolume] = useState(60);
  const systemActions = [
    { label: "Battery", action: "battery", icon: Battery },
    { label: "WiFi", action: "wifi", icon: Wifi },
    { label: "Bluetooth", action: "bluetooth", icon: Bluetooth },
    { label: "Volume", action: "volume", icon: Volume2 },
    { label: "Lock", action: "lock-screen", icon: Lock },
    { label: "Sleep", action: "sleep", icon: Moon }
  ];

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <GlassPanel className="p-5">
          <SectionTitle eyebrow="Applications" title="Open, quit, and inspect apps" />
          <div className="mt-4 grid gap-3">
            <Field label="Application">
              <Input value={appName} onChange={(event) => setAppName(event.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={<AppWindow size={16} />} onClick={() => void controller.runMacAction("open-app", appName)}>Open</Button>
              <Button icon={<X size={16} />} onClick={() => void controller.runMacAction("quit-app", appName)}>Quit</Button>
              <Button variant="ghost" onClick={() => void controller.runMacAction("active-app")}>Active App</Button>
              <Button variant="ghost" onClick={() => void controller.runMacAction("list-apps")}>List Apps</Button>
            </div>
          </div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <SectionTitle eyebrow="Browser & Files" title="Open websites, files, and folders" />
          <div className="mt-4 grid gap-3">
            <Field label="Website">
              <Input value={url} onChange={(event) => setUrl(event.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={<Globe size={16} />} onClick={() => void controller.runMacAction("open-url", url)}>Open Website</Button>
              <Button icon={<FileText size={16} />} onClick={() => void controller.runMacAction("open-file")}>Open File</Button>
              <Button icon={<FolderOpen size={16} />} onClick={() => void controller.runMacAction("open-folder")}>Open Folder</Button>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassPanel className="p-5">
          <SectionTitle eyebrow="Input" title="Type, copy, speak, and search" />
          <div className="mt-4 grid gap-3">
            <Field label="Text">
              <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Text for active app" />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={<Keyboard size={16} />} onClick={() => void controller.runMacAction("type", text)}>Type</Button>
              <Button icon={<Copy size={16} />} onClick={() => void controller.runMacAction("copy", text)}>Copy</Button>
              <Button icon={<Clipboard size={16} />} onClick={() => void controller.runMacAction("read-clipboard")}>Read Clipboard</Button>
              <Button icon={<Volume2 size={16} />} onClick={() => void controller.runMacAction("speak", text)}>Speak</Button>
            </div>
            <Field label="Spotlight">
              <Input value={spotlight} onChange={(event) => setSpotlight(event.target.value)} />
            </Field>
            <Button icon={<Search size={16} />} onClick={() => void controller.runMacAction("spotlight", spotlight)}>Search Spotlight</Button>
          </div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <SectionTitle eyebrow="System" title="Status and power controls" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {systemActions.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.action} onClick={() => void controller.runMacAction(item.action)} className="flex h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm transition hover:border-cyan-300/40">
                  <Icon size={18} className="text-cyan-200" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Field label={`Set volume: ${volume}`}>
              <input type="range" min={0} max={100} value={volume} onChange={(event) => setVolume(Number(event.target.value))} onMouseUp={() => void controller.runMacAction("set-volume", String(volume))} className="w-full accent-cyan-300" />
            </Field>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="p-5">
        <SectionTitle eyebrow="Vision" title="Screen intelligence" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={<Camera size={16} />} onClick={() => void controller.runMacAction("screenshot")}>Take Screenshot</Button>
          <Button variant="primary" icon={<Eye size={16} />} onClick={() => void controller.runMacAction("see-screen")}>Ask AI What I See</Button>
          <Button icon={<Sparkles size={16} />} onClick={() => void controller.runMacAction("notification", "ByteOS is active.")}>Test Notification</Button>
        </div>
      </GlassPanel>
    </div>
  );
}

function AutomationView({ controller }: { controller: ByteOSController }) {
  const [name, setName] = useState("Hourly focus reminder");
  const [payload, setPayload] = useState("Time to stretch and review priorities.");
  const [kind, setKind] = useState<Automation["kind"]>("speak");
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  function createAutomation() {
    const next: Automation = { id: crypto.randomUUID(), name, kind, payload, intervalMinutes, enabled: true };
    void controller.saveAutomations([next, ...controller.state.automations]);
  }

  function updateAutomation(id: string, patch: Partial<Automation>) {
    void controller.saveAutomations(controller.state.automations.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <GlassPanel className="p-5">
        <SectionTitle eyebrow="Create" title="New automation" />
        <div className="mt-4 grid gap-3">
          <Field label="Name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
          <Field label="Trigger type"><Select value={kind} onChange={(event) => setKind(event.target.value as Automation["kind"])}><option value="speak">Speak</option><option value="open-url">Open URL</option></Select></Field>
          <Field label="Payload"><Input value={payload} onChange={(event) => setPayload(event.target.value)} /></Field>
          <Field label="Schedule minutes"><Input type="number" value={intervalMinutes} onChange={(event) => setIntervalMinutes(Number(event.target.value))} /></Field>
          <Button variant="primary" icon={<Plus size={16} />} onClick={createAutomation}>Create Automation</Button>
        </div>
      </GlassPanel>
      <GlassPanel className="p-5">
        <SectionTitle eyebrow="Execution" title="Automations and history" />
        <div className="mt-4 space-y-3">
          {controller.state.automations.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.kind} · every {item.intervalMinutes} minutes</p>
                </div>
                <Switch.Root checked={item.enabled} onCheckedChange={(enabled) => updateAutomation(item.id, { enabled })} className="relative h-6 w-11 rounded-full bg-slate-700 data-[state=checked]:bg-cyan-400">
                  <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" icon={<Play size={16} />} onClick={() => void controller.runMacAction(item.kind === "speak" ? "speak" : "open-url", item.payload)}>Run</Button>
                <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => void controller.saveAutomations(controller.state.automations.filter((entry) => entry.id !== item.id))}>Delete</Button>
              </div>
            </div>
          ))}
          {controller.state.automations.length === 0 && <EmptyState title="No automations" text="Create a schedule above and ByteOS will keep it running locally." icon={<Zap size={24} />} />}
        </div>
      </GlassPanel>
    </div>
  );
}

function MemoryView({ controller }: { controller: ByteOSController }) {
  const [query, setQuery] = useState("");
  const [fact, setFact] = useState("");
  const [note, setNote] = useState("");
  const memory = controller.state.memory;
  const facts = memory.facts.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  function save(next: MemoryState) {
    void controller.updateMemory(next);
  }

  return (
    <div className="grid gap-5">
      <GlassPanel className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Field label="Search memory"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search facts, notes, todos" /></Field>
          </div>
          <Metric label="Facts" value={memory.facts.length} detail="saved" />
          <Metric label="Notes" value={memory.notes.length} detail="timeline" />
          <Metric label="Todos" value={memory.todos.length} detail="tracked" />
        </div>
      </GlassPanel>
      <div className="grid gap-5 xl:grid-cols-2">
        <GlassPanel className="p-5">
          <SectionTitle eyebrow="Facts" title="Assistant memory" />
          <div className="mt-4 flex gap-2">
            <Input value={fact} onChange={(event) => setFact(event.target.value)} placeholder="Remember that..." />
            <Button icon={<Plus size={16} />} onClick={() => { if (fact.trim()) { save({ ...memory, facts: [fact.trim(), ...memory.facts] }); setFact(""); } }}>Save</Button>
          </div>
          <div className="mt-4 space-y-2">
            {facts.map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] p-3 text-sm">
                <span>{item}</span>
                <Button variant="ghost" icon={<Trash2 size={14} />} onClick={() => save({ ...memory, facts: memory.facts.filter((factItem) => factItem !== item) })} />
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <SectionTitle eyebrow="Timeline" title="Notes and priorities" />
          <div className="mt-4 flex gap-2">
            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="New note" />
            <Button icon={<Plus size={16} />} onClick={() => { if (note.trim()) { save({ ...memory, notes: [{ text: note.trim(), created_at: new Date().toISOString(), importance: 3 }, ...memory.notes] }); setNote(""); } }}>Add</Button>
          </div>
          <div className="mt-4 space-y-2">
            {memory.notes.map((item, index) => (
              <div key={`${item.text}-${index}`} className="rounded-2xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white">{item.text}</p>
                  <Button variant="ghost" icon={<Trash2 size={14} />} onClick={() => save({ ...memory, notes: memory.notes.filter((_, noteIndex) => noteIndex !== index) })} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.category || "general"} · importance {item.importance || 3}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function FilesView({ controller }: { controller: ByteOSController }) {
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [nextName, setNextName] = useState("");
  const files = controller.state.files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="grid gap-5">
      <GlassPanel className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 min-w-[260px] flex-1 items-center gap-2 rounded-2xl bg-black/20 px-3">
            <Search size={16} className="text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search imported files" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
          </div>
          <Button variant="primary" icon={<Upload size={16} />} onClick={controller.importFiles}>Upload Files</Button>
        </div>
      </GlassPanel>
      <div className="grid gap-3">
        {files.map((file) => (
          <GlassPanel key={file.name} className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">{file.kind === "image" ? <ImageIcon size={22} /> : <FileText size={22} />}</div>
              <div className="min-w-[200px] flex-1">
                {renaming === file.name ? (
                  <Input value={nextName} onChange={(event) => setNextName(event.target.value)} />
                ) : (
                  <p className="font-medium text-white">{file.name}</p>
                )}
                <p className="text-xs text-slate-500">{file.kind} · {formatBytes(file.size)} · {new Date(file.modifiedAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" icon={<Eye size={16} />} onClick={() => void window.byteos?.openFile(file.path)}>Preview</Button>
                <Button variant="ghost" icon={<Sparkles size={16} />} onClick={() => void controller.analyzeFile(file.name)}>Analyze</Button>
                {renaming === file.name ? (
                  <Button icon={<Check size={16} />} onClick={() => { void controller.renameFile(file.name, nextName); setRenaming(null); }}>Save</Button>
                ) : (
                  <Button variant="ghost" icon={<Edit3 size={16} />} onClick={() => { setRenaming(file.name); setNextName(file.name); }}>Rename</Button>
                )}
                <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => void controller.deleteFile(file.name)}>Delete</Button>
              </div>
            </div>
          </GlassPanel>
        ))}
        {files.length === 0 && <EmptyState title="No files yet" text="Use Upload Files to import images, PDFs, text files, and documents into your local workspace." icon={<HardDrive size={26} />} />}
      </div>
    </div>
  );
}

function VoiceView({
  voiceState,
  setVoiceState,
  startVoice,
  stopVoice,
  speak,
  stopSpeaking
}: {
  voiceState: { listening: boolean; speaking: boolean; transcript: string; error: string; handsFree: boolean; volume: number };
  setVoiceState: (updater: (value: any) => any) => void;
  startVoice: (handsFree?: boolean) => void;
  stopVoice: () => void;
  speak: () => void;
  stopSpeaking: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <GlassPanel className="p-6 text-center">
        <div className={cn("mx-auto grid size-36 place-items-center rounded-full border border-white/10 bg-cyan-300/10 transition", voiceState.listening && "animate-pulse shadow-[0_0_80px_rgba(103,232,249,.22)]")}>
          <Mic size={44} className="text-cyan-200" />
        </div>
        <h3 className="mt-6 text-2xl font-semibold">{voiceState.listening ? "Listening" : voiceState.speaking ? "Speaking" : "Voice ready"}</h3>
        <p className="mt-2 text-sm text-slate-400">Use push-to-talk for commands or hands-free mode for longer dictation.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="primary" icon={<Mic size={16} />} onClick={() => startVoice(false)} disabled={voiceState.listening}>Push to Talk</Button>
          <Button icon={<Play size={16} />} onClick={() => startVoice(true)} disabled={voiceState.listening}>Hands Free</Button>
          <Button icon={<Square size={16} />} onClick={stopVoice}>Stop</Button>
          <Button icon={<Volume2 size={16} />} onClick={speak}>Speak Reply</Button>
          <Button variant="danger" icon={<Pause size={16} />} onClick={stopSpeaking}>Interrupt</Button>
        </div>
        {voiceState.error && <p className="mt-4 rounded-2xl bg-rose-400/10 p-3 text-sm text-rose-200">{voiceState.error}</p>}
      </GlassPanel>
      <GlassPanel className="p-5">
        <SectionTitle eyebrow="Live Transcription" title="Speech input" />
        <div className="mt-4 min-h-52 rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
          {voiceState.transcript || "Your spoken words will appear here while the microphone is active."}
        </div>
        <div className="mt-5 grid gap-4">
          <label className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 text-sm">
            Hands-free mode
            <Switch.Root checked={voiceState.handsFree} onCheckedChange={(checked) => checked ? startVoice(true) : stopVoice()} className="relative h-6 w-11 rounded-full bg-slate-700 data-[state=checked]:bg-cyan-400">
              <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </label>
          <Field label={`Voice volume: ${voiceState.volume}`}>
            <input type="range" min={0} max={100} value={voiceState.volume} onChange={(event) => setVoiceState((current) => ({ ...current, volume: Number(event.target.value) }))} className="w-full accent-cyan-300" />
          </Field>
          <div className="grid gap-2 text-sm text-slate-400">
            <p>Microphone selector: system default</p>
            <p>Speaker: macOS default output</p>
            <p>Wake word: optional, not enabled by default for privacy.</p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

function SettingsView({ controller }: { controller: ByteOSController }) {
  const config = controller.state.config;
  const [apiKey, setApiKey] = useState("");
  const [draft, setDraft] = useState(config);
  const tabs = ["Appearance", "Models", "Voice", "API Keys", "Permissions", "Memory", "Automation", "Developer", "About"];
  return (
    <GlassPanel className="p-5">
      <Tabs.Root defaultValue="Models" className="grid gap-5">
        <Tabs.List className="flex flex-wrap gap-2">
          {tabs.map((tab) => <Tabs.Trigger key={tab} value={tab} className="rounded-2xl px-3 py-2 text-sm text-slate-400 transition data-[state=active]:bg-white/10 data-[state=active]:text-white">{tab}</Tabs.Trigger>)}
        </Tabs.List>
        <Tabs.Content value="Appearance"><SettingsNote title="Premium dark theme" text="ByteOS is optimized for macOS with dark glass surfaces, cyan/blue/violet accents, and accessible focus states." /></Tabs.Content>
        <Tabs.Content value="Models">
          <div className="grid max-w-2xl gap-3">
            <Field label="Assistant name"><Input value={draft.assistant_name} onChange={(event) => setDraft({ ...draft, assistant_name: event.target.value })} /></Field>
            <Field label="Model"><Input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} /></Field>
            <Field label="Temperature"><Input type="number" step="0.1" value={draft.temperature} onChange={(event) => setDraft({ ...draft, temperature: Number(event.target.value) })} /></Field>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void controller.saveSettings(draft)}>Save Model Settings</Button>
              <Button onClick={() => void controller.setMode("fast")}>Fast</Button>
              <Button onClick={() => void controller.setMode("balanced")}>Balanced</Button>
              <Button onClick={() => void controller.setMode("deep")}>Deep</Button>
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content value="Voice"><SettingsNote title="Voice runtime" text="Voice uses local browser speech recognition when Electron exposes it and macOS say for text-to-speech output." /></Tabs.Content>
        <Tabs.Content value="API Keys">
          <div className="grid max-w-2xl gap-3">
            <p className="text-sm text-slate-400">Stored locally in your ByteOS data folder. Current status: {controller.state.hasApiKey ? "loaded" : "missing"}.</p>
            <Field label="Gemini API key"><Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Paste your free Gemini key" /></Field>
            <Button variant="primary" onClick={() => { void controller.saveApiKey(apiKey); setApiKey(""); }}>Save API Key</Button>
          </div>
        </Tabs.Content>
        <Tabs.Content value="Permissions"><SettingsNote title="macOS permissions" text="Screen, microphone, accessibility, automation, and files are controlled by macOS Privacy & Security." action={<Button onClick={controller.openPrivacySettings}>Open Privacy Settings</Button>} /></Tabs.Content>
        <Tabs.Content value="Memory"><SettingsNote title="Memory storage" text={`${controller.state.memory.facts.length} facts, ${controller.state.memory.notes.length} notes, and ${controller.state.memory.todos.length} todos are saved locally.`} /></Tabs.Content>
        <Tabs.Content value="Automation"><SettingsNote title="Automation runtime" text={`${controller.state.automations.length} automations configured. Enabled automations run while ByteOS is open.`} /></Tabs.Content>
        <Tabs.Content value="Developer"><DeveloperView controller={controller} compact /></Tabs.Content>
        <Tabs.Content value="About"><SettingsNote title="ByteOS" text="A local macOS AI assistant workbench built with Electron, Next.js, TypeScript, Tailwind CSS, Framer Motion, and Radix UI." /></Tabs.Content>
      </Tabs.Root>
    </GlassPanel>
  );
}

function DeveloperView({ controller, compact = false }: { controller: ByteOSController; compact?: boolean }) {
  return (
    <div className={cn("grid gap-5", !compact && "xl:grid-cols-2")}>
      <GlassPanel className="p-5">
        <SectionTitle eyebrow="Bridge" title="Electron runtime" />
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <p>Bridge: {typeof window !== "undefined" && window.byteos ? "available" : "missing"}</p>
          <p>Provider: {controller.state.config.provider}</p>
          <p>Model: {controller.state.config.model}</p>
          <p>API key: {controller.state.hasApiKey ? "loaded" : "missing"}</p>
        </div>
      </GlassPanel>
      <GlassPanel className="p-5">
        <SectionTitle eyebrow="Config" title="Current settings" />
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-black/35 p-4 text-xs text-cyan-100">{JSON.stringify(controller.state.config, null, 2)}</pre>
      </GlassPanel>
    </div>
  );
}

function LogsView({ controller }: { controller: ByteOSController }) {
  const logs = [...controller.activity, ...controller.state.logs].slice(0, 150);
  return (
    <GlassPanel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle eyebrow="Runtime" title="Activity logs" />
        <Button variant="danger" icon={<Trash2 size={16} />} onClick={controller.clearLogs}>Clear Logs</Button>
      </div>
      <Timeline activity={logs} />
    </GlassPanel>
  );
}

function AssistantPanel({ controller, latestReply, speak, stopSpeaking, voiceState }: { controller: ByteOSController; latestReply: string; speak: (text: string) => void; stopSpeaking: () => void; voiceState: { listening: boolean; speaking: boolean } }) {
  return (
    <aside className="hidden min-h-0 overflow-auto xl:block">
      <GlassPanel className="p-5">
        <div className="flex items-center justify-between">
          <SectionTitle eyebrow="Assistant" title="Control panel" />
          <span className={cn("size-2.5 rounded-full", controller.isBusy ? "bg-amber-300" : "bg-cyan-300")} />
        </div>
        <div className="mt-5 grid gap-2">
          <Button variant="primary" icon={<Play size={16} />} onClick={() => void controller.setMode("fast")}>Fast Mode</Button>
          <Button icon={<Square size={16} />} onClick={() => void controller.setMode("balanced")}>Balanced Mode</Button>
          <Button variant="ghost" icon={<Brain size={16} />} onClick={() => void controller.setMode("deep")}>Deep Planning</Button>
        </div>
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest Reply</p>
          <p className="mt-3 line-clamp-6 text-sm leading-6 text-slate-300">{latestReply}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" icon={<Volume2 size={16} />} onClick={() => speak(latestReply)}>Speak</Button>
            <Button variant="ghost" icon={<Pause size={16} />} onClick={stopSpeaking}>Stop</Button>
          </div>
        </div>
        <div className="mt-5 grid gap-2 text-sm text-slate-400">
          <p>Voice: {voiceState.listening ? "listening" : voiceState.speaking ? "speaking" : "idle"}</p>
          <p>Memory: {controller.state.memory.facts.length + controller.state.memory.notes.length} items</p>
          <p>Automations: {controller.state.automations.filter((item) => item.enabled).length} enabled</p>
        </div>
      </GlassPanel>
    </aside>
  );
}

function StatusBar({ controller, voiceState }: { controller: ByteOSController; voiceState: { listening: boolean; speaking: boolean } }) {
  return (
    <footer className="flex h-10 items-center justify-between border-t border-white/10 bg-[#080c12]/85 px-5 text-xs text-slate-500 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2"><span className={cn("size-2 rounded-full", controller.state.hasApiKey ? "bg-cyan-300" : "bg-rose-400")} /> {controller.state.hasApiKey ? "API ready" : "API key missing"}</span>
        <span className="capitalize">{controller.state.config.response_mode}</span>
        <span>{controller.isBusy ? "Working" : "Idle"}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{voiceState.listening ? "Listening" : voiceState.speaking ? "Speaking" : "Voice idle"}</span>
        <span>{controller.state.files.length} files</span>
      </div>
    </footer>
  );
}

function Timeline({ activity }: { activity: ActivityItem[] }) {
  return (
    <GlassPanel className="p-5">
      <SectionTitle eyebrow="Activity" title="Timeline" />
      <div className="mt-4 space-y-3">
        {activity.slice(0, 8).map((item) => (
          <div key={item.id} className="flex gap-3 rounded-2xl bg-white/[0.035] p-3 text-sm">
            <span className={cn("mt-1 size-2 shrink-0 rounded-full", item.level === "error" ? "bg-rose-400" : item.level === "warn" ? "bg-amber-300" : item.level === "automation" ? "bg-violet-300" : "bg-cyan-300")} />
            <div className="min-w-0">
              <p className="text-slate-300">{item.message}</p>
              <p className="mt-1 text-xs text-slate-600">{formatTime(item.at)}</p>
            </div>
          </div>
        ))}
        {activity.length === 0 && <EmptyLine icon={<History size={16} />} text="Activity will appear here as ByteOS works." />}
      </div>
    </GlassPanel>
  );
}

function FileRow({ file, onOpen }: { file: WorkbenchFile; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06]">
      {file.kind === "image" ? <ImageIcon size={18} className="text-cyan-200" /> : <FileText size={18} className="text-cyan-200" />}
      <div className="min-w-0">
        <p className="truncate text-sm text-white">{file.name}</p>
        <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
      </div>
    </button>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
      <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
    </div>
  );
}

function EmptyState({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">{icon}</div>
        <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function EmptyLine({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-2 rounded-2xl border border-dashed border-white/10 p-3 text-sm text-slate-500">{icon}{text}</div>;
}

function SettingsNote({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
