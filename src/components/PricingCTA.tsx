/**
 * Premium subscription CTA inspired by world-class SaaS pricing
 * @module components
 */

import { Link } from "react-router-dom";
import { ArrowRight, Check, Crown, Rocket, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const PricingCTA = () => {
  const { language } = useLanguage();

  const isNl = language === "nl";

  return (
    <section className="container mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/[0.04] border border-border">
        {/* Decorative background */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-3xl pointer-events-none" />

        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
              <Zap className="h-3.5 w-3.5" />
              {isNl ? "Pro plannen" : "Plans professionnels"}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight">
              {isNl
                ? "Verkoop sneller met een Pro-plan"
                : "Vendez plus vite avec un plan\u00a0Pro"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              {isNl
                ? "Geverifieerde badge, prioriteitspositie in de zoekresultaten en geavanceerde statistieken om uw zichtbaarheid te maximaliseren."
                : "Badge vérifié, position prioritaire dans les résultats et statistiques avancées pour maximiser votre visibilité."}
            </p>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto mb-10">
            {/* Pro */}
            <div className="relative rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-6 sm:p-7 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Pro</p>
                  <p className="text-primary font-extrabold text-2xl leading-none">
                    50€<span className="text-xs font-normal text-muted-foreground">/mois</span>
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {[
                  isNl ? "Tot 30 gelijktijdige advertenties" : "Jusqu'à 30 annonces simultanées",
                  isNl ? 'Geverifieerde "Pro" badge' : 'Badge "Vendeur Pro" vérifié',
                  isNl ? "Prioriteitspositie in resultaten" : "Mise en avant dans les résultats",
                  isNl ? "Prioritaire ondersteuning 7/7" : "Support prioritaire 7j/7",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl border border-amber-400/25 bg-card/80 backdrop-blur-sm p-6 sm:p-7 hover:border-amber-400/40 transition-colors">
              <div className="absolute -top-3 right-5">
                <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  {isNl ? "Populair" : "Populaire"}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Premium</p>
                  <p className="text-amber-500 font-extrabold text-2xl leading-none">
                    200€<span className="text-xs font-normal text-muted-foreground">/mois</span>
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {[
                  isNl ? "Onbeperkt aantal advertenties" : "Annonces simultanées illimitées",
                  isNl ? "Gegarandeerde #1 positie" : "Position #1 garantie dans les résultats",
                  isNl ? "Onbeperkte HD-foto's" : "Photos HD illimitées par annonce",
                  isNl ? "Toegewijde VIP-accountmanager" : "Account manager VIP dédié",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/pricing">
              <Button size="lg" className="rounded-full h-13 px-8 font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                {isNl ? "Bekijk alle tarieven" : "Découvrir tous les tarifs"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              {isNl ? "Gratis voor particulieren · Annuleer op elk moment" : "Gratuit pour les particuliers · Annulez à tout moment"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCTA;
