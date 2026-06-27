"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ActivityItem,
  AppState,
  AssistantConfig,
  Automation,
  ChatMessage,
  MemoryState
} from "@/types/byteos";

const fallbackState: AppState = {
  config: {
    assistant_name: "ByteOS",
    provider: "gemini",
    model: "gemini-3.1-flash-lite",
    fallback_models: [],
    temperature: 0.5,
    memory_file: "memory.json",
    history_file: "history.json",
    notes_dir: "notes",
    screenshots_dir: "screenshots",
    response_mode: "fast",
    max_memory_chars: 8000,
    max_history_messages: 12,
    max_output_tokens: 512,
    api_timeout_seconds: 20,
    retry_attempts: 1,
    allow_shell_commands: false
  },
  memory: { facts: [], notes: [], todos: [] },
  history: [],
  automations: [],
  files: [],
  logs: [],
  hasApiKey: false
};

export function useByteOS() {
  const [state, setState] = useState<AppState>(fallbackState);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const api = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return window.byteos;
  }, []);

  const pushActivity = useCallback((message: string, level: ActivityItem["level"] = "info") => {
    setActivity((items) => [
      { id: crypto.randomUUID(), message, level, at: new Date().toISOString() },
      ...items
    ].slice(0, 100));
  }, []);

  const refresh = useCallback(async () => {
    if (!api) {
      setIsLoading(false);
      pushActivity("Electron bridge is not available. Run the app with npm start.", "warn");
      return;
    }
    const nextState = await api.getState();
    setState(nextState);
    setIsLoading(false);
  }, [api, pushActivity]);

  useEffect(() => {
    refresh();
    api?.onActivity((payload) => {
      setActivity((items) => [
        { id: crypto.randomUUID(), ...payload },
        ...items
      ].slice(0, 100));
    });
  }, [api, refresh]);

  const sendChat = useCallback(async (prompt: string) => {
    if (!api || !prompt.trim()) return;
    setIsBusy(true);
    setState((current) => ({
      ...current,
      history: [...current.history, { role: "user", text: prompt }]
    }));
    try {
      const result = await api.sendChat({ prompt });
      setState((current) => ({
        ...current,
        history: [...current.history, { role: "model", text: result.reply }]
      }));
      pushActivity(result.ok ? "Assistant replied." : result.reply, result.ok ? "info" : "warn");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }, [api, pushActivity, refresh]);

  const runMacAction = useCallback(async (action: string, value = "") => {
    if (!api) return { ok: false, message: "Electron bridge is not available." };
    setIsBusy(true);
    pushActivity(`Running ${action}${value ? `: ${value}` : ""}`);
    try {
      const result = await api.macAction({ action, value });
      pushActivity(result.message || result.reply || "Action finished.", result.ok ? "info" : "warn");
      await refresh();
      return result;
    } finally {
      setIsBusy(false);
    }
  }, [api, pushActivity, refresh]);

  const saveSettings = useCallback(async (config: Partial<AssistantConfig>) => {
    if (!api) return;
    const nextConfig = await api.saveSettings(config);
    setState((current) => ({ ...current, config: nextConfig }));
    pushActivity("Settings saved.");
  }, [api, pushActivity]);

  const setMode = useCallback(async (mode: "fast" | "balanced" | "deep") => {
    if (!api) return;
    const nextConfig = await api.setMode(mode);
    setState((current) => ({ ...current, config: nextConfig }));
    pushActivity(`Switched to ${mode} mode.`);
  }, [api, pushActivity]);

  const saveApiKey = useCallback(async (apiKey: string) => {
    if (!api) return;
    const result = await api.saveApiKey(apiKey);
    setState((current) => ({ ...current, hasApiKey: result.hasApiKey }));
    pushActivity("API key saved locally.");
  }, [api, pushActivity]);

  const updateMemory = useCallback(async (memory: MemoryState) => {
    if (!api) return;
    const nextMemory = await api.updateMemory(memory);
    setState((current) => ({ ...current, memory: nextMemory }));
    pushActivity("Memory updated.");
  }, [api, pushActivity]);

  const saveAutomations = useCallback(async (automations: Automation[]) => {
    if (!api) return;
    const nextAutomations = await api.saveAutomations(automations);
    setState((current) => ({ ...current, automations: nextAutomations }));
    pushActivity("Automations updated.");
  }, [api, pushActivity]);

  const importFiles = useCallback(async () => {
    if (!api) return;
    const files = await api.importFiles();
    setState((current) => ({ ...current, files }));
    pushActivity("Files imported.");
  }, [api, pushActivity]);

  const deleteFile = useCallback(async (name: string) => {
    if (!api) return;
    const files = await api.deleteFile(name);
    setState((current) => ({ ...current, files }));
    pushActivity(`Deleted ${name}.`, "warn");
  }, [api, pushActivity]);

  const renameFile = useCallback(async (name: string, nextName: string) => {
    if (!api) return;
    const files = await api.renameFile({ name, nextName });
    setState((current) => ({ ...current, files }));
    pushActivity(`Renamed ${name}.`);
  }, [api, pushActivity]);

  const analyzeFile = useCallback(async (name: string) => {
    if (!api) return;
    setIsBusy(true);
    try {
      const result = await api.analyzeFile(name);
      setState((current) => ({
        ...current,
        history: [...current.history, { role: "user", text: `Analyze file: ${name}` }, { role: "model", text: result.reply }]
      }));
      pushActivity(result.ok ? `Analyzed ${name}.` : result.reply, result.ok ? "info" : "warn");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }, [api, pushActivity, refresh]);

  const clearLogs = useCallback(async () => {
    if (!api) return;
    const logs = await api.clearLogs();
    setState((current) => ({ ...current, logs }));
    setActivity([]);
  }, [api]);

  const exportChat = useCallback(async () => {
    if (!api) return;
    const result = await api.exportChat();
    pushActivity(result.message, result.ok ? "info" : "warn");
  }, [api, pushActivity]);

  const openPrivacySettings = useCallback(() => {
    api?.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy");
  }, [api]);

  const clearActivity = useCallback(() => setActivity([]), []);

  return {
    state,
    activity,
    isLoading,
    isBusy,
    refresh,
    sendChat,
    runMacAction,
    saveSettings,
    setMode,
    saveApiKey,
    updateMemory,
    saveAutomations,
    importFiles,
    deleteFile,
    renameFile,
    analyzeFile,
    clearLogs,
    exportChat,
    openPrivacySettings,
    clearActivity
  };
}

export type ByteOSController = ReturnType<typeof useByteOS>;
