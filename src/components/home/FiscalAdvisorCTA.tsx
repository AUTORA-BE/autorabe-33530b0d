/**
 * FiscalAdvisorCTA — Premium glass banner promoting the AI Belgian tax advisor.
 * @module components/home
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Calculator, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const FiscalAdvisorCTA = memo(function FiscalAdvisorCTA() {
  const { language } = useLanguage();

  const t = {
    badge:
      language === "nl" ? "AI-belastingadviseur" :
      language === "de" ? "KI-Steuerberater" :
      language === "en" ? "AI tax advisor" : "Conseiller fiscal IA",
    title:
      language === "nl" ? "Bereken uw Belgische autobelasting in enkele seconden" :
      language === "de" ? "Berechnen Sie Ihre belgischen Kfz-Steuern in Sekunden" :
      language === "en" ? "Calculate your Belgian car taxes in seconds" :
      "Calculez votre fiscalité auto belge en quelques secondes",
    subtitle:
      language === "nl" ? "TMC, jaarlijkse belasting, LEZ – krijg een duidelijk antwoord, regio per regio." :
      language === "de" ? "TMC, Jahressteuer, Umweltzone – klare Antworten für jede Region." :
      language === "en" ? "TMC, annual tax, LEZ — clear answers, region by region." :
      "TMC, taxe annuelle, LEZ — réponse claire, région par région.",
    cta:
      language === "nl" ? "Meer informatie" :
      language === "de" ? "Mehr erfahren" :
      language === "en" ? "Learn more" : "En savoir plus",
    chips: [
      { icon: Calculator, label: language === "nl" ? "TMC" : "TMC" },
      { icon: MapPin, label: "LEZ" },
      { icon: Sparkles, label: "Gemini AI" },
    ],
  };

  return (
    <>
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Subtle accent halo — keeps section airy on the unified slate canvas */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(var(--accent-electric) / 0.10) 0%, transparent 65%)" }} />


        <div className="container mx-auto px-6 sm:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative max-w-4xl mx-auto rounded-3xl p-8 md:p-12 lg:p-14
              bg-[hsl(var(--surface-glass)/0.55)] backdrop-blur-2xl
              border border-[hsl(var(--border-glass)/0.4)]
              shadow-[0_20px_60px_-20px_hsl(var(--accent-electric)/0.25)]"
          >
            {/* Subtle electric corner glow */}
            <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent-electric))] to-transparent opacity-60" />

            <div className="flex flex-col items-center text-center gap-5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                bg-[hsl(var(--accent-electric)/0.12)] border border-[hsl(var(--accent-electric)/0.25)]
                text-[hsl(var(--accent-electric))] text-[10.5px] font-medium uppercase tracking-[0.22em]">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                {t.badge}
              </span>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight text-foreground max-w-3xl">
                {t.title}
              </h2>

              <p className="text-sm sm:text-base font-light leading-relaxed text-[hsl(var(--text-secondary))] max-w-2xl">
                {t.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {t.chips.map((chip, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    bg-[hsl(var(--surface-glass)/0.5)] border border-[hsl(var(--border-glass)/0.3)]
                    text-xs text-[hsl(var(--text-secondary))]">
                    <chip.icon className="w-3 h-3" strokeWidth={1.8} />
                    {chip.label}
                  </span>
                ))}
              </div>

              <Button
                asChild
                variant="primary"
                size="lg"
                className="mt-4 px-7 py-6 text-base"
              >
                <Link to="/fiscalite-auto-2026">
                  {t.cta}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
});

export default FiscalAdvisorCTA;
