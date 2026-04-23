/**
 * PricingCTA — premium Belgian pricing teaser, hero-coherent
 * @module components
 */

import { Link } from "react-router-dom";
import { ArrowRight, Check, Crown, Rocket, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedHref } from "@/lib/useLocalizedHref";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const PricingCTA = () => {
  const { language } = useLanguage();
  const localized = useLocalizedHref();
  const isNl = language === "nl";

  return (
    <section className="container mx-auto px-6 sm:px-8 py-20 sm:py-32">
      <motion.div
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl hover:shadow-2xl transition-shadow duration-500"
      >
        {/* Premium ambient glow */}
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-32 -right-24 w-[360px] h-[360px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)" }} />
        </div>
        {/* Subtle top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="relative px-8 py-20 sm:px-16 sm:py-28">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-20">
            <motion.div {...fadeUp(0.02)} className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-light text-primary tracking-wide">
                <Sparkles className="w-3 h-3" strokeWidth={1.8} />
                {isNl ? "Pro-plannen" : "Plans Pro"}
              </span>
            </motion.div>
            <motion.h2
              {...fadeUp(0.05)}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-5 leading-[1.15]"
            >
              {isNl ? (
                <>Verkoop sneller <span className="text-primary">met un Pro-plan</span></>
              ) : (
                <>Vendez plus vite <span className="text-primary">avec un plan&nbsp;Pro</span></>
              )}
            </motion.h2>
            <motion.p
              {...fadeUp(0.1)}
              className="text-muted-foreground text-sm sm:text-base font-light max-w-md mx-auto leading-relaxed"
            >
              {isNl
                ? "Geverifieerde badge, prioriteitspositie en geavanceerde statistieken."
                : "Badge vérifié, position prioritaire et statistiques avancées."}
            </motion.p>
          </div>

          {/* Cards — premium with hover lift + glow */}
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8 max-w-2xl mx-auto mb-12">
            {/* Pro */}
            <motion.div
              {...fadeUp(0.15)}
              className="group relative rounded-3xl border border-border/40 bg-card/80 backdrop-blur-sm p-7 sm:p-9 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Rocket className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pro</p>
                  <p className="text-primary font-light text-2xl leading-none">
                    50€<span className="text-xs font-light text-muted-foreground">/mois</span>
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  isNl ? "Tot 10 gelijktijdige advertenties" : "Jusqu'à 10 annonces simultanées",
                  isNl ? 'Geverifieerde "Pro" badge' : 'Badge "Vendeur Pro" vérifié',
                  isNl ? "Dashboard met statistieken" : "Dashboard avec statistiques",
                  isNl ? "Prioritaire ondersteuning 7/7" : "Support prioritaire 7j/7",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground font-light">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={1.8} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Premium — accentué */}
            <motion.div
              {...fadeUp(0.2)}
              className="group relative rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/[0.04] via-card/80 to-card/80 backdrop-blur-sm p-7 sm:p-9 shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.3)] hover:shadow-[0_18px_44px_-10px_hsl(var(--primary)/0.45)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Recommended ribbon */}
              <span className="absolute -top-3 right-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium tracking-wide shadow-md">
                <Crown className="w-3 h-3" strokeWidth={2} />
                {isNl ? "Aanbevolen" : "Recommandé"}
              </span>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Crown className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-foreground">Premium</p>
                  <p className="text-primary font-light text-2xl leading-none">
                    250€<span className="text-xs font-light text-muted-foreground">/mois</span>
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  isNl ? "Onbeperkt aantal advertenties" : "Annonces simultanées illimitées",
                  isNl ? "Gegarandeerde #1 positie" : "Position #1 garantie",
                  isNl ? "Onbeperkte HD-foto's" : "Photos HD illimitées",
                  isNl ? "Toegewijde VIP-accountmanager" : "Account manager VIP dédié",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground font-light">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={1.8} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div {...fadeUp(0.25)} className="text-center">
            <Link to={localized("/pricing")}>
              <Button
                size="lg"
                className="rounded-full h-13 px-10 font-semibold text-sm group active:scale-[0.97] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_14px_36px_-8px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 transition-all duration-300"
              >
                {isNl ? "Bekijk alle tarieven" : "Découvrir tous les tarifs"}
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground font-light mt-4">
              {isNl ? "Gratis voor particulieren · Annuleer op elk moment" : "Gratuit pour les particuliers · Annulez à tout moment"}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default PricingCTA;
