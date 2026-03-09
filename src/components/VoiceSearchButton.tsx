import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Mic, Car, Banknote, Check, Gauge, Fuel } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAllBrands } from "@/utils/carUtils";
import { BUDGET_OPTIONS } from "@/features/search/types/search.types";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

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

interface DetectedEntity {
  type: 'brand' | 'budget' | 'mileage' | 'fuel';
  value: string;
}

export interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
}

/** Detects brands and budgets from a transcript string */
function useDetectedEntities(transcript: string): DetectedEntity[] {
  const brands = useMemo(() => getAllBrands(), []);

  return useMemo(() => {
    if (!transcript) return [];
    const lower = transcript.toLowerCase();
    const entities: DetectedEntity[] = [];

    const foundBrand = brands.find(b => lower.includes(b.toLowerCase()));
    if (foundBrand) entities.push({ type: 'brand', value: foundBrand });

    const budgetMatch = lower.match(/(\d+[\s.]?\d*)\s*(euro|€)/i);
    if (budgetMatch) {
      let budget = parseInt(budgetMatch[1].replace(/\D/g, ''));
      if (budget < 1000 && budget > 0) budget *= 1000;
      const option = BUDGET_OPTIONS.find(o => o.value >= budget);
      if (option) entities.push({ type: 'budget', value: option.label });
    }

    const kmMatch = lower.match(/(\d+[\s.]?\d*)\s*(km|kilomètre|kilometer|kilo)/i);
    if (kmMatch) {
      let km = parseInt(kmMatch[1].replace(/\D/g, ''));
      if (km < 1000 && km > 0) km *= 1000;
      entities.push({ type: 'mileage', value: `${km.toLocaleString('fr-BE')} km` });
    }

    // Fuel type detection
    const fuelMap: { keywords: string[]; label: string }[] = [
      { keywords: ['électrique', 'electrique', 'electric', 'elektrisch'], label: 'Électrique' },
      { keywords: ['hybride', 'hybrid'], label: 'Hybride' },
      { keywords: ['diesel'], label: 'Diesel' },
      { keywords: ['essence', 'benzine', 'gasoline', 'petrol'], label: 'Essence' },
    ];
    for (const fuel of fuelMap) {
      if (fuel.keywords.some(k => lower.includes(k))) {
        entities.push({ type: 'fuel', value: fuel.label });
        break;
      }
    }

    return entities;
  }, [transcript, brands]);
}

export function VoiceSearchButton({ onResult }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { language } = useLanguage();
  const detectedEntities = useDetectedEntities(transcript);
  const { impactMedium } = useHapticFeedback();
  const previousEntitiesCount = useRef(0);
  const confirmSoundRef = useRef<AudioContext | null>(null);

  const playConfirmSound = useCallback(() => {
    try {
      const ctx = confirmSoundRef.current ?? new AudioContext();
      confirmSoundRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext not supported
    }
  }, []);

  useEffect(() => {
    if (detectedEntities.length > previousEntitiesCount.current) {
      impactMedium();
      playConfirmSound();
    }
    previousEntitiesCount.current = detectedEntities.length;
  }, [detectedEntities.length, impactMedium, playConfirmSound]);

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
        // Keep transcript visible briefly before clearing
        setTimeout(() => {
          setIsListening(false);
          setTranscript("");
        }, 1200);
        recognition.stop();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setTranscript("");
      if (event.error === 'not-allowed') {
        toast.error(language === 'nl' ? "Microfoontoegang geweigerd" : "Accès au microphone refusé");
      } else if (event.error === 'no-speech') {
        toast.error(language === 'nl' ? "Geen spraak gedetecteerd" : "Aucune voix détectée");
      }
    };

    recognition.onend = () => {
      // Delay clearing so user sees final result
      setTimeout(() => {
        setIsListening(false);
      }, 800);
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
      setTranscript("");
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
            {/* Transcript bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-sm py-3 px-4 rounded-xl shadow-xl min-w-[220px] max-w-[320px] text-center border z-50"
            >
              {/* Transcript text */}
              <div className="mb-1.5">
                {transcript || (language === 'nl' ? "Luisteren..." : "Écoute en cours...")}
              </div>

              {/* Detected entity chips */}
              <AnimatePresence>
                {detectedEntities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap items-center justify-center gap-1.5 pt-1.5 border-t border-border/50"
                  >
                    {detectedEntities.map((entity, i) => (
                      <motion.span
                        key={`${entity.type}-${i}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25, delay: i * 0.1 }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          entity.type === 'brand'
                            ? 'bg-primary/15 text-primary'
                            : entity.type === 'budget'
                              ? 'bg-accent text-accent-foreground'
                              : entity.type === 'fuel'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {entity.type === 'brand' ? (
                          <Car className="w-3 h-3" />
                        ) : entity.type === 'budget' ? (
                          <Banknote className="w-3 h-3" />
                        ) : entity.type === 'fuel' ? (
                          <Fuel className="w-3 h-3" />
                        ) : (
                          <Gauge className="w-3 h-3" />
                        )}
                        {entity.value}
                        <Check className="w-3 h-3 ml-0.5" />
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Arrow */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-b border-r rotate-45" />
            </motion.div>

            {/* Pulse ring */}
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
