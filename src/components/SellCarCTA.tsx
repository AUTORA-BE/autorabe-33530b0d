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
    <section className="container mx-auto px-6 sm:px-8 py-20 sm:py-32">
      <motion.div
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-shadow duration-500"
      >
        {/* Premium ambient glow */}
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-32 -left-24 w-[360px] h-[360px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)" }} />
        </div>
        {/* Subtle top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="relative px-8 py-20 sm:px-16 sm:py-28">
          <div className="max-w-2xl mx-auto">
            {/* Eyebrow badge */}
            <motion.div
              {...fadeUp(0.02)}
              className="flex justify-center mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-light text-primary tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                {isNl ? "Vertrouwd door duizenden Belgische verkopers" : "Fait confiance par des milliers de vendeurs belges"}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              {...fadeUp(0.05)}
              className="font-serif text-center text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-5 leading-[1.15]"
            >
              {isNl ? (
                <>Uw auto verdient <span className="text-primary">de juiste koper</span></>
              ) : (
                <>Votre voiture mérite <span className="text-primary">le bon acheteur</span></>
              )}
            </motion.h2>

            <motion.p
              {...fadeUp(0.1)}
              className="text-muted-foreground text-sm sm:text-base font-light text-center max-w-lg mx-auto mb-14 leading-relaxed"
            >
              {isNl
                ? "AutoRA brengt uw voertuig bij duizenden serieuze kopers in België. Elke advertentie is Car-Pass geverifieerd en LEZ-conform — meer vertrouwen, snellere verkoop."
                : "AutoRA connecte votre véhicule à des milliers d'acheteurs sérieux en Belgique. Chaque annonce est vérifiée Car-Pass et conforme LEZ — plus de confiance, vente plus rapide."}
            </motion.p>

            {/* Steps — premium with hover lift */}
            <motion.div
              {...fadeUp(0.15)}
              className="grid grid-cols-3 gap-4 sm:gap-8 mb-14 max-w-md mx-auto"
            >
              {steps.map((step, i) => (
                <div key={i} className="group flex flex-col items-center text-center gap-3">
                  <div className="relative w-14 h-14 rounded-3xl bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_28px_-8px_hsl(var(--primary)/0.4)] group-hover:border-primary/30">
                    <step.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center shadow-md">
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
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" strokeWidth={1.8} />
                  <span>{isNl ? b.nl : b.fr}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div {...fadeUp(0.25)} className="text-center">
              <Button
                size="lg"
                onClick={() => navigate("/sell")}
                className="rounded-full h-13 px-10 font-semibold text-sm group active:scale-[0.97] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_14px_36px_-8px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 transition-all duration-300"
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
      </motion.div>
    </section>
  );
});

SellCarCTA.displayName = "SellCarCTA";

export default SellCarCTA;
