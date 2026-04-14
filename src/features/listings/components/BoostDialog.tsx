/**
 * BoostDialog — Modal to choose boost tier for a listing
 * @module features/listings/components
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Check, Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { BOOST_TIERS } from "../constants/boostTiers";

interface BoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingName: string;
  onBoostApplied?: () => void;
}

function BoostSuccessAnimation() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-8 gap-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <Rocket className="w-16 h-16 text-primary" />
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center">
        <h3 className="font-display text-xl font-bold text-foreground mb-1">Boost activé ! 🎉</h3>
        <p className="text-sm text-muted-foreground">Votre annonce est maintenant mise en avant</p>
      </motion.div>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 }}
          transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: "easeOut" }}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function BoostDialog({ open, onOpenChange, listingId, listingName, onBoostApplied }: BoostDialogProps) {
  const { t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBoost = async () => {
    if (!selectedTier) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-boost-checkout", {
        body: { boostTier: selectedTier, listingId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'activation du boost");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (value: boolean) => {
    if (!isLoading) {
      setShowSuccess(false);
      setSelectedTier(null);
      onOpenChange(value);
    }
  };

  const selected = BOOST_TIERS.find((t) => t.id === selectedTier);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <BoostSuccessAnimation key="success" />
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display text-xl">
                  <Rocket className="w-5 h-5 text-primary" />
                  Booster cette annonce
                </DialogTitle>
                <DialogDescription>
                  <span className="font-medium text-foreground">{listingName}</span>
                  {" — Choisissez la durée de mise en avant"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 mt-5">
                {BOOST_TIERS.map((tier, i) => (
                  <motion.button
                    key={tier.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedTier === tier.id
                        ? `${tier.accent} bg-primary/5 shadow-md`
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{tier.icon}</span>
                          <span className="font-semibold text-foreground">{tier.name}</span>
                          {tier.popular && (
                            <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                              Populaire
                            </Badge>
                          )}
                        </div>
                        <ul className="space-y-1">
                          {tier.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-foreground">{tier.price}€</div>
                        <div className="text-xs text-muted-foreground">{tier.days === 1 ? '24h' : `${tier.days} jours`}</div>
                      </div>
                    </div>

                    {selectedTier === tier.id && (
                      <motion.div
                        layoutId="boost-selected"
                        className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleClose(false)} disabled={isLoading}>
                  Annuler
                </Button>
                <Button className="flex-1 rounded-xl gap-2" onClick={handleBoost} disabled={!selectedTier || isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {selected ? `Payer ${selected.price}€` : 'Sélectionnez une option'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">Paiement sécurisé par Stripe 🔒</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
