export type VoiceStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "speaking"
  | "stopped"
  | "denied"
  | "unsupported"
  | "error";

export type VoiceSettings = {
  autoSend: boolean;
  enabled: boolean;
  pushToTalk: boolean;
  speakReplies: boolean;
};

export type SpeechRecognitionResultAlternativeLike = {
  transcript: string;
};

export type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionResultAlternativeLike;
};

export type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

export type SpeechRecognitionErrorEventLike = Event & {
  error: string;
  message?: string;
};

export type SpeechRecognitionInstance = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
