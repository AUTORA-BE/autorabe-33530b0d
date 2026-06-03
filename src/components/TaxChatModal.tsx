/**
 * Modal de chat fiscal contextuel
 * Explique les taxes belges pour un véhicule donné via Lovable AI
 *
 * @module components/TaxChatModal
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Send, Bot, User, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import ComplianceBanner from '@/components/ComplianceBanner';

interface VehicleContext {
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  power?: number | null;
  euroNorm?: string | null;
}

interface TaxChatModalProps {
  vehicle: VehicleContext;
}

type Region = 'bruxelles' | 'wallonie' | 'flandre';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-taxes`;

/**
 * Modal interactive pour expliquer les taxes belges d'un véhicule
 */
export default function TaxChatModal({ vehicle }: TaxChatModalProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<Region>('bruxelles');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /** Envoie une requête en streaming */
  const streamQuestion = useCallback(async (question: string) => {
    setIsLoading(true);
    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          vehicle,
          region,
          question,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error('Trop de requêtes, réessayez dans quelques instants.');
        } else if (resp.status === 402) {
          toast.error('Service temporairement indisponible.');
        } else {
          toast.error('Erreur lors de la génération de la réponse.');
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              const finalContent = assistantContent;
              setMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1 && m.role === 'assistant'
                    ? { ...m, content: finalContent }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('Tax chat error:', e);
      toast.error('Erreur de connexion.');
    } finally {
      setIsLoading(false);
    }
  }, [vehicle, region]);

  /** Démarre la conversation initiale */
  const handleStart = useCallback(() => {
    setHasStarted(true);
    setMessages([]);
    streamQuestion(`Explique-moi les taxes pour ce véhicule en région ${region}.`);
  }, [region, streamQuestion]);

  /** Envoie une question de suivi */
  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    streamQuestion(question);
  }, [input, isLoading, streamQuestion]);

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { setOpen(v); if (!v) { setHasStarted(false); setMessages([]); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="w-4 h-4" />
          Explique-moi les taxes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Conseiller fiscal – {vehicle.brand} {vehicle.model}
          </DialogTitle>
        </DialogHeader>

        <ComplianceBanner className="mt-2" />

        {!hasStarted ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez votre région pour obtenir une estimation personnalisée des taxes (TMC, taxe de circulation, LEZ…).
            </p>
            <Select value={region} onValueChange={(v: string) => setRegion(v as Region)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bruxelles">🏙️ Bruxelles-Capitale</SelectItem>
                <SelectItem value="wallonie">🌲 Wallonie</SelectItem>
                <SelectItem value="flandre">🌊 Flandre</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStart} className="w-full">
              <Bot className="w-4 h-4 mr-2" />
              Obtenir mon estimation fiscale
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 py-3 min-h-[300px] max-h-[50vh]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content || (isLoading ? '…' : '')}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages.length === 0 && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse en cours…
                </div>
              )}
            </div>

            {/* Input de suivi */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez une question de suivi…"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
