import { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Type definitions for SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

export interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
}

export function VoiceSearchButton({ onResult }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    const langMap: Record<string, string> = {
      fr: "fr-FR",
      nl: "nl-NL",
      en: "en-US",
      de: "de-DE"
    };
    recognition.lang = langMap[language] || "fr-FR";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      
      if (event.results[0].isFinal) {
        onResult(currentTranscript.trim());
        setIsListening(false);
        recognition.stop();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error(language === 'nl' ? "Microfoontoegang geweigerd" : "Accès au microphone refusé");
      } else if (event.error === 'no-speech') {
        toast.error(language === 'nl' ? "Geen spraak gedetecteerd" : "Aucune voix détectée");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onResult]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative flex items-center justify-center">
      <Button
        variant={isListening ? "default" : "outline"}
        size="icon"
        type="button"
        onClick={toggleListening}
        className={`rounded-md relative z-10 transition-colors h-full aspect-square ${
          isListening ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card text-muted-foreground hover:bg-muted"
        }`}
        aria-label={language === 'nl' ? "Gesproken zoekopdracht" : "Recherche vocale"}
      >
        {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
      </Button>

      <AnimatePresence>
        {isListening && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-sm py-2 px-4 rounded-lg shadow-xl whitespace-nowrap min-w-[200px] text-center border z-50"
            >
              {transcript || (language === 'nl' ? "Luisteren..." : "Écoute en cours...")}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-b border-r rotate-45" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 0.2, 0], scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-primary rounded-md z-0 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
