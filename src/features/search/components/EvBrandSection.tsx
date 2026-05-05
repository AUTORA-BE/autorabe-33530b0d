/**
 * EV brand quick-filter section — luxe, brand logos
 * @module features/search/components
 */
import { memo } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

import volkswagenLogo from "@/assets/brands/volkswagen.png";
import bmwLogo from "@/assets/brands/bmw.png";
import audiLogo from "@/assets/brands/audi.png";
import mercedesLogo from "@/assets/brands/mercedes.png";
import peugeotLogo from "@/assets/brands/peugeot.png";
import renaultLogo from "@/assets/brands/renault.png";
import hyundaiLogo from "@/assets/brands/hyundai.png";
import kiaLogo from "@/assets/brands/kia.png";
import volvoLogo from "@/assets/brands/volvo.png";

interface EvBrandSectionProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

// Pure EV brands — no logo in catalog yet, rendered as luxe chip with bolt
const PURE_EV_BRANDS = ["Tesla", "Polestar", "BYD", "MG", "Xpeng"] as const;

// Brands with significant EV lineup — use real logos
const EV_LINEUP_BRANDS: { name: string; logo: string; models: string }[] = [
  { name: "Volkswagen",    logo: volkswagenLogo, models: "ID.3, ID.4, ID.5, ID.7" },
  { name: "BMW",           logo: bmwLogo,        models: "iX, i4, i5, i7" },
  { name: "Audi",          logo: audiLogo,       models: "Q4 e-tron, e-tron, Q8 e-tron" },
  { name: "Mercedes-Benz", logo: mercedesLogo,   models: "EQA, EQB, EQC, EQE, EQS" },
  { name: "Hyundai",       logo: hyundaiLogo,    models: "Ioniq 5, Ioniq 6, Kona EV" },
  { name: "Kia",           logo: kiaLogo,        models: "EV6, EV9, Niro EV" },
  { name: "Renault",       logo: renaultLogo,    models: "Zoe, Megane E-Tech" },
  { name: "Peugeot",       logo: peugeotLogo,    models: "e-208, e-2008, e-308" },
  { name: "Volvo",         logo: volvoLogo,      models: "XC40 Recharge, EX30, EX90" },
];

const EvBrandSection = memo(function EvBrandSection({
  onBrandFilter,
  selectedBrand,
}: EvBrandSectionProps) {
  const { language } = useLanguage();
  const label = language === "nl"
    ? "100% elektrische merken"
    : language === "en"
    ? "100% electric brands"
    : language === "de"
    ? "100 % Elektromarken"
    : "Marques 100% électriques";
  const subLabel = language === "nl" ? "Met EV-aanbod"
    : language === "en" ? "Brands with EV lineup"
    : language === "de" ? "Marken mit EV-Modellen"
    : "Marques avec gamme électrique";

  const handleClick = (brand: string) => {
    if (onBrandFilter) {
      onBrandFilter(selectedBrand === brand ? "" : brand);
    }
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header — luxe minimal */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="w-4 h-4 text-primary" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-light text-foreground leading-tight">
            {label}
          </h3>
        </div>
      </div>

      {/* Pure EV brands — luxe chips */}
      <div className="flex flex-wrap gap-2.5 mb-10">
        {PURE_EV_BRANDS.map((name) => {
          const active = selectedBrand === name;
          return (
            <button
              key={name}
              onClick={() => handleClick(name)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 active:scale-[0.96]",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                  : "border-border/60 text-foreground/80 hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <Zap className={cn("w-3 h-3", active ? "" : "text-primary")} strokeWidth={2} />
              {name}
            </button>
          );
        })}
      </div>

      {/* EV-lineup brands — real logos */}
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-5 font-light">
        {subLabel}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4">
        {EV_LINEUP_BRANDS.map((b) => {
          const active = selectedBrand === b.name;
          return (
            <button
              key={b.name}
              onClick={() => handleClick(b.name)}
              aria-pressed={active}
              title={b.models}
              className={cn(
                "group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 active:scale-[0.95]",
                active
                  ? "bg-primary/8 border-primary/30 shadow-sm"
                  : "border-transparent hover:border-border/40 hover:bg-card/40"
              )}
            >
              <div className={cn(
                "relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 p-2 sm:p-2.5 transition-all duration-300 shadow-sm",
                active && "ring-2 ring-primary/40"
              )}>
                <img
                  src={b.logo}
                  alt={`${b.name} logo`}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  draggable="false"
                />
                {/* EV bolt micro-badge */}
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <Zap className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={2.5} />
                </span>
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs font-light text-center leading-tight truncate w-full transition-colors",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {b.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
});

export default EvBrandSection;
