const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("byteos", {
  getState: () => ipcRenderer.invoke("app:state"),
  sendChat: (payload) => ipcRenderer.invoke("chat:send", payload),
  macAction: (payload) => ipcRenderer.invoke("mac:action", payload),
  saveSettings: (config) => ipcRenderer.invoke("settings:save", config),
  setMode: (mode) => ipcRenderer.invoke("settings:mode", mode),
  updateMemory: (memory) => ipcRenderer.invoke("memory:update", memory),
  saveAutomations: (automations) => ipcRenderer.invoke("automations:save", automations),
  saveApiKey: (apiKey) => ipcRenderer.invoke("key:save", apiKey),
  importFiles: () => ipcRenderer.invoke("files:import"),
  deleteFile: (name) => ipcRenderer.invoke("files:delete", name),
  renameFile: (payload) => ipcRenderer.invoke("files:rename", payload),
  analyzeFile: (name) => ipcRenderer.invoke("files:analyze", name),
  clearLogs: () => ipcRenderer.invoke("logs:clear"),
  exportChat: () => ipcRenderer.invoke("chat:export"),
  openExternal: (target) => ipcRenderer.invoke("open:external", target),
  openFile: (target) => ipcRenderer.invoke("open:file", target),
  showMessage: (options) => ipcRenderer.invoke("dialog:message", options),
  onActivity: (callback) => {
    ipcRenderer.on("activity", (_event, payload) => callback(payload));
  }
});
