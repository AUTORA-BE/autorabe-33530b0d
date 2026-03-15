/**
 * SellCarCTA — Premium conversion section
 * @module components
 */

import { memo } from "react";
import { ArrowRight, Car, Shield, Clock, Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] as const },
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
    <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20">
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-card to-card" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

        <div className="relative px-5 py-12 sm:px-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto">
            {/* Badge */}
            <motion.div {...fadeUp(0)} className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-current" />
                {isNl ? "Eenvoudig & snel" : "Simple & rapide"}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              {...fadeUp(0.08)}
              className="font-display text-center text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-foreground mb-4 leading-[1.15] tracking-tight"
            >
              {isNl ? (
                <>Verkoop uw auto<br className="sm:hidden" /> <span className="text-primary">in 3 minuten</span></>
              ) : (
                <>Vendez votre voiture<br className="sm:hidden" /> <span className="text-primary">en 3 minutes</span></>
              )}
            </motion.h2>

            <motion.p
              {...fadeUp(0.12)}
              className="text-muted-foreground text-sm sm:text-base text-center max-w-xl mx-auto mb-10"
            >
              {isNl
                ? "Bereik duizenden kopers in België. Uw advertentie wordt automatisch geverifieerd en is direct zichtbaar."
                : "Touchez des milliers d'acheteurs en Belgique. Votre annonce est vérifiée automatiquement et visible instantanément."}
            </motion.p>

            {/* Steps */}
            <motion.div
              {...fadeUp(0.16)}
              className="grid grid-cols-3 gap-3 sm:gap-6 mb-10 max-w-lg mx-auto"
            >
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-medium text-foreground leading-tight">
                    {isNl ? step.labelNl : step.labelFr}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Benefits */}
            <motion.div
              {...fadeUp(0.2)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto mb-10"
            >
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{isNl ? b.nl : b.fr}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div {...fadeUp(0.24)} className="text-center">
              <Button
                size="lg"
                onClick={() => navigate("/sell")}
                className="rounded-full h-12 sm:h-14 px-8 sm:px-10 font-semibold text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all group active:scale-[0.97]"
              >
                {isNl ? "Start mijn advertentie" : "Publier mon annonce gratuitement"}
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="text-[11px] text-muted-foreground mt-3">
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
