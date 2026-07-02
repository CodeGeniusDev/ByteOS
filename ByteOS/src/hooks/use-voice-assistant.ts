import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  isTextToSpeechSupported,
  requestMicrophonePermission,
  stripMarkdownForSpeech,
} from "@/services/voice";
import type {
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionInstance,
  VoiceSettings,
  VoiceStatus,
} from "@/types/voice";

type UseVoiceAssistantOptions = {
  onTranscriptFinal: (transcript: string, autoSend: boolean) => void;
};

export function useVoiceAssistant({ onTranscriptFinal }: UseVoiceAssistantOptions) {
  const [settings, setSettings] = useState<VoiceSettings>({
    autoSend: false,
    enabled: true,
    pushToTalk: true,
    speakReplies: false,
  });
  const [status, setStatus] = useState<VoiceStatus>(() =>
    isSpeechRecognitionSupported() ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");

  const support = useMemo(
    () => ({
      recognition: isSpeechRecognitionSupported(),
      synthesis: isTextToSpeechSupported(),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function updateSetting<Key extends keyof VoiceSettings>(key: Key, value: VoiceSettings[Key]) {
    if (key === "enabled" && value === false) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;

      if (support.synthesis) {
        window.speechSynthesis.cancel();
      }

      finalTranscriptRef.current = "";
      setFinalTranscript("");
      setInterimTranscript("");
      setStatus("stopped");
    }

    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function startListening() {
    setError(null);

    if (!settings.enabled) {
      setStatus("stopped");
      setError("Voice assistant is disabled.");
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setStatus("unsupported");
      setError("Speech recognition is not supported in this browser. You can still type prompts.");
      return;
    }

    try {
      setStatus("requesting");
      await requestMicrophonePermission();
    } catch {
      setStatus("denied");
      setError("Microphone permission was denied or unavailable.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.continuous = !settings.pushToTalk;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      let finalText = finalTranscriptRef.current;

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalText = `${finalText} ${transcript}`.trim();
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }

      finalTranscriptRef.current = finalText;
      setFinalTranscript(finalText);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      setStatus(denied ? "denied" : "error");
      setError(denied ? "Microphone permission was denied." : event.message || "Voice recognition failed.");
    };

    recognition.onend = () => {
      const transcript = finalTranscriptRef.current.trim();
      recognitionRef.current = null;
      setInterimTranscript("");

      if (transcript) {
        onTranscriptFinal(transcript, settings.autoSend);
      }

      setStatus((current) => (current === "denied" || current === "error" ? current : "stopped"));
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setStatus("listening");
    } catch {
      setStatus("error");
      setError("Voice recognition could not start. Try again or type your prompt.");
    }
  }

  function stopListening() {
    if (!recognitionRef.current) {
      setStatus("stopped");
      return;
    }

    recognitionRef.current.stop();
  }

  function toggleListening() {
    if (status === "listening" || status === "requesting") {
      stopListening();
      return;
    }

    void startListening();
  }

  function speak(text: string) {
    setError(null);

    if (!settings.enabled || !settings.speakReplies) {
      return;
    }

    if (!support.synthesis) {
      setStatus("unsupported");
      setError("Text-to-speech is not supported in this browser.");
      return;
    }

    const spokenText = stripMarkdownForSpeech(text);
    if (!spokenText) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => {
      setStatus("error");
      setError("Speech playback failed.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (support.synthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus("stopped");
  }

  return {
    error,
    finalTranscript,
    interimTranscript,
    isListening: status === "listening" || status === "requesting",
    isSpeaking: status === "speaking",
    settings,
    status,
    support,
    setError,
    speak,
    startListening,
    stopListening,
    stopSpeaking,
    toggleListening,
    updateSetting,
  };
}
