/**
 * Page dédiée — Marques avec gamme électrique disponibles sur AutoRA.
 * Mix marques 100% EV + constructeurs avec gamme EV partielle.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { BackButton } from "@/shared/components";

import volkswagenLogo from "@/assets/brands/volkswagen.png";
import bmwLogo from "@/assets/brands/bmw.png";
import audiLogo from "@/assets/brands/audi.png";
import mercedesLogo from "@/assets/brands/mercedes.png";
import peugeotLogo from "@/assets/brands/peugeot.png";
import renaultLogo from "@/assets/brands/renault.png";
import hyundaiLogo from "@/assets/brands/hyundai.png";
import kiaLogo from "@/assets/brands/kia.png";
import volvoLogo from "@/assets/brands/volvo.png";

interface BrandInfo {
  name: string;
  logo?: string;
  models: string;
  description: string;
}

const PURE_EV: BrandInfo[] = [
  { name: "Tesla", models: "Model 3, Model Y, Model S, Model X", description: "Pionnier EV. 400–600 km d'autonomie, Supercharger." },
  { name: "Polestar", models: "Polestar 2, 3, 4", description: "Design scandinave épuré, gamme premium." },
  { name: "Rivian", models: "R1T, R1S", description: "SUV & pick-up électriques aventure." },
  { name: "Lucid", models: "Air, Gravity", description: "Berlines luxe, autonomie record (>700 km)." },
  { name: "BYD", models: "Atto 3, Seal, Dolphin", description: "Constructeur chinois, batterie Blade." },
  { name: "NIO", models: "ET5, ET7, EL7", description: "Échange de batterie, premium chinois." },
  { name: "XPENG", models: "G6, P7, G9", description: "Tech avancée, conduite autonome." },
  { name: "Fisker", models: "Ocean", description: "SUV éco-responsable, design californien." },
];

const HYBRID_LINEUP: BrandInfo[] = [
  { name: "Volkswagen", logo: volkswagenLogo, models: "ID.3, ID.4, ID.5, ID.7", description: "Plateforme MEB, 350–550 km d'autonomie." },
  { name: "BMW", logo: bmwLogo, models: "iX, i4, i5, i7", description: "Luxe allemand, charge rapide 200 kW." },
  { name: "Audi", logo: audiLogo, models: "Q4 e-tron, e-tron, Q8 e-tron", description: "Premium technologique, quattro électrique." },
  { name: "Mercedes-Benz", logo: mercedesLogo, models: "EQA, EQB, EQC, EQE, EQS", description: "Confort haut de gamme, EQS jusqu'à 780 km." },
  { name: "Hyundai", logo: hyundaiLogo, models: "Ioniq 5, Ioniq 6, Kona EV", description: "Plateforme E-GMP, charge ultra-rapide 800V." },
  { name: "Kia", logo: kiaLogo, models: "EV6, EV9, Niro EV", description: "Design audacieux, EV9 SUV 7 places." },
  { name: "Renault", logo: renaultLogo, models: "Zoe, Megane E-Tech", description: "Pionnier européen, citadines & compactes." },
  { name: "Peugeot", logo: peugeotLogo, models: "e-208, e-2008, e-308", description: "Design lion électrifié, polyvalence française." },
  { name: "Volvo", logo: volvoLogo, models: "XC40 Recharge, EX30, EX90", description: "Sécurité scandinave, gamme 100% électrifiée à venir." },
];

export default function MarquesElectriques() {
  return (
    <>
      <SEOHead
        title="Marques voitures électriques en Belgique"
        description="Découvrez toutes les marques de voitures électriques disponibles sur AutoRA Belgique : Tesla, Polestar, BMW i, Audi e-tron, Mercedes EQ et plus."
        type="website"
      />

      <main className="min-h-screen bg-background">
        {/* HERO */}
        <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1920&q=80"
            alt="Voiture électrique de prestige"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/80 dark:from-background/40 dark:via-background/70 dark:to-background" />
          <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex flex-col justify-end pb-16 sm:pb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md w-fit mb-5">
              <Zap className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">
                100% Électrique
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light text-white dark:text-foreground leading-[1.05] tracking-tight max-w-3xl">
              L'électrique <span className="text-primary italic">de prestige</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/80 dark:text-muted-foreground font-light leading-relaxed">
              Toutes les marques de voitures électriques disponibles sur AutoRA, en Belgique.
              Du pure player à l'icône allemande — choisissez votre prochain trajet sans compromis.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-6 sm:px-8 pt-8">
          <BackButton to="/" className="mb-2" />
        </div>

        {/* PURE EV */}
        <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-20">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3 font-medium">
              Pure Players
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground tracking-tight">
              Marques 100% Électriques
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PURE_EV.map((b) => (
              <BrandCard key={b.name} brand={b} />
            ))}
          </div>
        </section>

        {/* HYBRID LINEUP */}
        <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-20 border-t border-border/40">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3 font-medium">
              Constructeurs historiques
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground tracking-tight">
              Marques avec gamme électrique
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {HYBRID_LINEUP.map((b) => (
              <BrandCard key={b.name} brand={b} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function BrandCard({ brand }: { brand: BrandInfo }) {
  const href = `/?brand=${encodeURIComponent(brand.name)}`;
  return (
    <Link
      to={href}
      className="group block rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 hover:border-primary/40 hover:bg-card/70 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center gap-4 mb-4">
        {brand.logo ? (
          <div className="w-14 h-14 rounded-xl bg-white p-2.5 shadow-sm flex items-center justify-center shrink-0">
            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" loading="lazy" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
        )}
        <div>
          <h3 className="font-serif text-xl font-medium text-foreground">{brand.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-light">{brand.models}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground/90 leading-relaxed mb-4 font-light">
        {brand.description}
      </p>
      <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium group-hover:gap-2.5 transition-all duration-300">
        Voir les annonces
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
      </span>
    </Link>
  );
}
