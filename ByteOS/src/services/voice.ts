import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionWindow,
  VoiceStatus,
} from "@/types/voice";

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function isTextToSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export async function requestMicrophonePermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is unavailable in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

export function voiceStatusLabel(status: VoiceStatus) {
  const labels: Record<VoiceStatus, string> = {
    denied: "Permission denied",
    error: "Voice error",
    idle: "Ready",
    listening: "Listening",
    requesting: "Requesting mic",
    speaking: "Speaking",
    stopped: "Stopped",
    unsupported: "Unsupported",
  };

  return labels[status];
}

export function stripMarkdownForSpeech(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " code block omitted. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
