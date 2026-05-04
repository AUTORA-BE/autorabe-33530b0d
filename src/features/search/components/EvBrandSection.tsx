/**
 * EV brand quick-filter strip — 100% electric brands only
 * @module features/search/components
 */
import { memo } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface EvBrandSectionProps {
  onBrandFilter?: (brand: string) => void;
  selectedBrand?: string;
}

const EV_BRANDS = [
  { name: "Tesla",    emoji: "⚡" },
  { name: "Polestar", emoji: "⚡" },
  { name: "BYD",      emoji: "⚡" },
  { name: "MG",       emoji: "⚡" },
  { name: "Xpeng",    emoji: "⚡" },
] as const;

// Brands with significant EV lineup shown with EV badge
const EV_LINEUP_BRANDS = [
  { name: "Volkswagen", models: ["ID.3","ID.4","ID.5","ID.7"] },
  { name: "BMW",        models: ["iX","i4","i5","i7"] },
  { name: "Audi",       models: ["Q4 e-tron","e-tron","Q8 e-tron"] },
  { name: "Mercedes-Benz", models: ["EQA","EQB","EQC","EQE","EQS"] },
  { name: "Hyundai",    models: ["Ioniq 5","Ioniq 6","Kona EV"] },
  { name: "Kia",        models: ["EV6","EV9","Niro EV"] },
  { name: "Renault",    models: ["Zoe","Megane E-Tech"] },
  { name: "Peugeot",    models: ["e-208","e-2008","e-308"] },
  { name: "Volvo",      models: ["XC40 Recharge","C40","EX30","EX90"] },
] as const;

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

  const handleClick = (brand: string) => {
    if (onBrandFilter) {
      onBrandFilter(selectedBrand === brand ? "" : brand);
    }
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-6 sm:px-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20">
          <Zap className="w-3.5 h-3.5 text-green-500" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>

      {/* Pure EV brands */}
      <div className="flex flex-wrap gap-2 mb-4">
        {EV_BRANDS.map((b) => (
          <button
            key={b.name}
            onClick={() => handleClick(b.name)}
            aria-pressed={selectedBrand === b.name}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
              selectedBrand === b.name
                ? "bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/30"
                : "border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
            )}
          >
            <Zap className="w-3 h-3" strokeWidth={2} />
            {b.name}
          </button>
        ))}
      </div>

      {/* Multi-brand EV lineups */}
      <div className="flex flex-wrap gap-2">
        {EV_LINEUP_BRANDS.map((b) => (
          <button
            key={b.name}
            onClick={() => handleClick(b.name)}
            aria-pressed={selectedBrand === b.name}
            title={b.models.join(", ")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-200",
              selectedBrand === b.name
                ? "bg-primary/10 text-primary border-primary/30"
                : "border-border/50 text-muted-foreground hover:border-primary/20 hover:text-foreground"
            )}
          >
            {b.name}
            <span className="text-green-500 text-[9px] font-bold">EV</span>
          </button>
        ))}
      </div>
    </section>
  );
});

export default EvBrandSection;
