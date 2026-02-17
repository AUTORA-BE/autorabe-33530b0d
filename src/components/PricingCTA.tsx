/**
 * CTA banner for the pricing page on the homepage
 * @module components
 */

import { Link } from "react-router-dom";
import { ArrowRight, Crown, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingCTA = () => {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        <div className="relative px-6 py-10 sm:px-12 sm:py-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Vendeur professionnel ?
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
              Boostez vos ventes avec un plan&nbsp;Pro
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto lg:mx-0">
              Badge vérifié, position prioritaire dans les résultats et statistiques avancées pour maximiser votre visibilité.
            </p>
          </div>

          {/* Right — mini tier cards + CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Pro mini card */}
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 min-w-[160px]">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Pro</p>
                <p className="text-primary font-extrabold text-lg leading-none">50€<span className="text-xs font-normal text-muted-foreground">/mois</span></p>
              </div>
            </div>

            {/* Premium mini card */}
            <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-400/20 rounded-2xl px-5 py-4 min-w-[160px]">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Premium</p>
                <p className="text-amber-500 font-extrabold text-lg leading-none">200€<span className="text-xs font-normal text-muted-foreground">/mois</span></p>
              </div>
            </div>

            <Link to="/pricing">
              <Button size="lg" className="rounded-xl h-12 px-6 font-semibold whitespace-nowrap">
                Voir les tarifs
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCTA;
