/**
 * PricingCTA — minimal luxury pricing teaser
 * @module components
 */

import { Link } from "react-router-dom";
import { ArrowRight, Check, Crown, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const PricingCTA = () => {
  const { language } = useLanguage();
  const isNl = language === "nl";

  return (
    <section className="container mx-auto px-6 sm:px-8 py-20 sm:py-32">
      <div className="relative overflow-hidden rounded-3xl bg-card/15 border border-border/15">
        <div className="relative px-8 py-20 sm:px-16 sm:py-28">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-20">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-5 leading-[1.15]">
              {isNl ? "Verkoop sneller met een Pro-plan" : "Vendez plus vite avec un plan\u00a0Pro"}
            </h2>
            <p className="text-muted-foreground text-sm font-light max-w-md mx-auto">
              {isNl
                ? "Geverifieerde badge, prioriteitspositie en geavanceerde statistieken."
                : "Badge vérifié, position prioritaire et statistiques avancées."}
            </p>
          </div>

          {/* Cards — ultra-clean */}
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8 max-w-2xl mx-auto mb-12">
            {/* Pro */}
            <div className="rounded-3xl border border-border/20 bg-card/30 p-7 sm:p-9">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-11 w-11 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                  <Rocket className="h-5 w-5 text-primary/70" strokeWidth={1.5} />
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
                    <Check className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" strokeWidth={1.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div className="rounded-3xl border border-primary/15 bg-primary/[0.02] p-7 sm:p-9">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-11 w-11 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 text-primary/70" strokeWidth={1.5} />
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
                    <Check className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" strokeWidth={1.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/pricing">
              <Button size="lg" className="rounded-full h-13 px-10 font-medium text-sm transition-all">
                {isNl ? "Bekijk alle tarieven" : "Découvrir tous les tarifs"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground font-light mt-4">
              {isNl ? "Gratis voor particulieren · Annuleer op elk moment" : "Gratuit pour les particuliers · Annulez à tout moment"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCTA;
