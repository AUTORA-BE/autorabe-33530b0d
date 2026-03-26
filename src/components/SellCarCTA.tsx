/**
 * SellCarCTA — minimal premium conversion section
 * @module components
 */

import { memo } from "react";
import { ArrowRight, Car, Shield, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const SellCarCTA = memo(() => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isNl = language === "nl";

  const steps = [
    { icon: Car, labelFr: "Décrivez votre véhicule", labelNl: "Beschrijf uw voertuig", num: "1" },
    { icon: Shield, labelFr: "Vérification automatique", labelNl: "Automatische verificatie", num: "2" },
    { icon: Clock, labelFr: "En ligne en 3 minutes", labelNl: "Online in 3 minuten", num: "3" },
  ];

  const benefits = [
    { fr: "Annonce gratuite pour particuliers", nl: "Gratis advertentie voor particulieren" },
    { fr: "Vérification Car-Pass automatique", nl: "Automatische Car-Pass verificatie" },
    { fr: "Conformité LEZ instantanée", nl: "Directe LEZ-conformiteit" },
    { fr: "Aucune commission sur la vente", nl: "Geen verkoopcommissie" },
  ];

  return (
    <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-28">
      <div className="relative overflow-hidden rounded-3xl border border-border/20 bg-card/20">
        <div className="relative px-6 py-16 sm:px-16 sm:py-24">
          <div className="max-w-2xl mx-auto">
            {/* Headline */}
            <motion.h2
              {...fadeUp(0.05)}
              className="font-serif text-center text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-5 leading-[1.15]"
            >
              {isNl ? (
                <>Verkoop uw auto <span className="text-primary">in 3 minuten</span></>
              ) : (
                <>Vendez votre voiture <span className="text-primary">en 3 minutes</span></>
              )}
            </motion.h2>

            <motion.p
              {...fadeUp(0.1)}
              className="text-muted-foreground text-sm font-light text-center max-w-lg mx-auto mb-14"
            >
              {isNl
                ? "Bereik duizenden kopers in België. Uw advertentie wordt automatisch geverifieerd."
                : "Touchez des milliers d'acheteurs en Belgique. Votre annonce est vérifiée automatiquement."}
            </motion.p>

            {/* Steps — minimal */}
            <motion.div
              {...fadeUp(0.15)}
              className="grid grid-cols-3 gap-4 sm:gap-8 mb-14 max-w-md mx-auto"
            >
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className="relative w-14 h-14 rounded-3xl bg-primary/5 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary/70" strokeWidth={1.5} />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                      {step.num}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-light text-muted-foreground leading-tight">
                    {isNl ? step.labelNl : step.labelFr}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Benefits */}
            <motion.div
              {...fadeUp(0.2)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto mb-14"
            >
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-foreground font-light">
                  <CheckCircle2 className="w-4 h-4 text-primary/60 shrink-0" strokeWidth={1.5} />
                  <span>{isNl ? b.nl : b.fr}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div {...fadeUp(0.25)} className="text-center">
              <Button
                size="lg"
                onClick={() => navigate("/sell")}
                className="rounded-full h-13 px-10 font-medium text-sm transition-all group active:scale-[0.97]"
              >
                {isNl ? "Start mijn advertentie" : "Publier mon annonce"}
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="text-[11px] text-muted-foreground font-light mt-4">
                {isNl ? "Geen creditcard nodig · Geen commissie" : "Sans carte bancaire · Sans commission"}
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
