/**
 * SellCarCTA — minimal luxury conversion block
 * @module components
 */

import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const badges = {
  fr: [
    "100% Gratuit pour les particuliers",
    "Vérification Car-Pass & LEZ",
    "Zéro commission sur la vente",
  ],
  nl: [
    "100% Gratis voor particulieren",
    "Car-Pass & LEZ-verificatie",
    "Nul commissie op de verkoop",
  ],
};

const SellCarCTA = memo(() => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isNl = language === "nl";

  const goToSell = () => navigate(user ? "/sell" : "/auth?returnTo=/sell");

  const tagline = isNl
    ? "Verkoop uw voertuig snel, veilig en zonder tussenpersoon."
    : "Vendez votre véhicule rapidement, en toute sécurité et sans intermédiaire.";

  const badgeList = isNl ? badges.nl : badges.fr;

  return (
    <section className="relative px-6 sm:px-8 py-20 sm:py-32 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),transparent_50%)]">
      <div className="container mx-auto">
        <motion.div
          {...fadeUp(0)}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-shadow duration-500"
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none opacity-60">
            <div
              className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-32 -left-24 w-[360px] h-[360px] rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)" }}
            />
          </div>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="relative px-8 py-24 sm:px-16 sm:py-36">
            <div className="max-w-2xl mx-auto text-center">

              {/* Eyebrow */}
              <motion.div {...fadeUp(0.02)} className="flex justify-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  {isNl ? "Gratis publiceren, Car-Pass geverifieerd" : "Publication gratuite, Car-Pass vérifié"}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h2
                {...fadeUp(0.06)}
                className="text-2xl sm:text-4xl md:text-5xl font-light leading-[1.15] md:leading-[1.1] tracking-tight text-foreground mb-6 md:mb-8"
              >
                {isNl
                  ? <>Uw auto verdient <span className="text-primary">de juiste koper</span></>
                  : <>Votre voiture mérite <span className="text-primary">le bon acheteur</span></>}
              </motion.h2>

              {/* Single tagline */}
              <motion.p
                {...fadeUp(0.11)}
                className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed mb-10"
              >
                {tagline}
              </motion.p>

              {/* 3 minimal badges */}
              <motion.div
                {...fadeUp(0.16)}
                className="flex flex-wrap justify-center gap-3 mb-14"
              >
                {badgeList.map((label) => (
                  <span
                    key={label}
                    className="px-4 py-1.5 rounded-full border border-border/50 bg-card/50 text-[11px] text-muted-foreground font-light tracking-wide"
                  >
                    {label}
                  </span>
                ))}
              </motion.div>

              {/* CTA — full-width thumb-friendly tap target on mobile */}
              <motion.div {...fadeUp(0.21)} className="w-full max-w-sm md:max-w-none md:w-auto md:inline-block">
                <Button
                  size="lg"
                  onClick={goToSell}
                  className="w-full md:w-auto rounded-full px-8 md:px-10 py-4 md:py-3 font-semibold text-sm group active:scale-[0.97] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_14px_36px_-8px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  {isNl ? "Start mijn advertentie" : "Publier mon annonce"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

SellCarCTA.displayName = "SellCarCTA";

export default SellCarCTA;
