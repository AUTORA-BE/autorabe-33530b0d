/**
 * SellCarCTA — section CTA premium pour vendre sa voiture
 * @module components
 */

import { memo } from "react";
import { ArrowRight, Car, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const SellCarCTA = memo(() => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isNl = language === "nl";

  const steps = [
    { icon: Car, labelFr: "Décrivez votre véhicule", labelNl: "Beschrijf uw voertuig" },
    { icon: Shield, labelFr: "Vérification automatique", labelNl: "Automatische verificatie" },
    { icon: Clock, labelFr: "Publié en 3 minutes", labelNl: "Gepubliceerd in 3 minuten" },
  ];

  return (
    <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/[0.08] via-card to-card border border-primary/20">
        {/* Decorative background */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/[0.08] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/[0.05] blur-3xl pointer-events-none" />

        <div className="relative px-5 py-10 sm:px-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <motion.span
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
            >
              <Car className="w-3.5 h-3.5" />
              {isNl ? "Verkoop uw auto" : "Vendez votre voiture"}
            </motion.span>

            <motion.h2
              {...fadeUp(0.1)}
              className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight"
            >
              {isNl
                ? "Verkoop uw auto in 3 minuten"
                : "Vendez votre voiture en\u00a03\u00a0minutes"}
            </motion.h2>

            <motion.p
              {...fadeUp(0.15)}
              className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-8"
            >
              {isNl
                ? "Gratis advertentie, automatische Car-Pass verificatie en directe LEZ-compatibiliteitscontrole. Bereik duizenden potentiële kopers."
                : "Annonce gratuite, vérification Car-Pass automatique et contrôle LEZ instantané. Touchez des milliers d'acheteurs potentiels."}
            </motion.p>

            {/* Steps */}
            <motion.div
              {...fadeUp(0.2)}
              className="flex items-center justify-center gap-4 sm:gap-8 mb-8"
            >
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground hidden sm:block">
                    {isNl ? step.labelNl : step.labelFr}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="w-6 sm:w-10 h-px bg-border ml-2 sm:ml-3 hidden sm:block" />
                  )}
                </div>
              ))}
            </motion.div>

            <motion.div {...fadeUp(0.25)}>
              <Button
                size="lg"
                onClick={() => navigate("/sell")}
                className="rounded-full h-12 sm:h-13 px-8 font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow group"
              >
                {isNl ? "Start mijn advertentie" : "Publier mon annonce"}
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                {isNl ? "Gratis voor particulieren · Geen commissie" : "Gratuit pour les particuliers · Aucune commission"}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
});

SellCarCTA.displayName = "SellCarCTA";

export default SellCarCTA;
