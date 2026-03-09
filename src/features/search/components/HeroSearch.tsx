/**
 * HeroSearch component — immersive hero with parallax, premium copy and trust signals
 * @module features/search/components
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, ShieldCheck, FileCheck, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUDGET_OPTIONS } from "../types/search.types";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { parseVoiceTranscript } from "@/lib/voiceEntityDetection";
import type { QuickSearchParams } from "../types/search.types";

/** Parallax hook — moves element based on scroll */
function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setOffset(window.scrollY * speed);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return offset;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

export interface HeroSearchProps {
  onSearch: (brand: string, model: string, maxPrice: number, maxMileage?: number, fuelType?: string, transmission?: string, euroNorm?: string, color?: string) => void;
}

const HeroSearch = memo(function HeroSearch({ onSearch }: HeroSearchProps) {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<number>(0);
  const [model, setModel] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const { t, language } = useLanguage();
  const parallaxOffset = useParallax(0.25);
  const isNl = language === "nl";

  useEffect(() => {
    setBrands(getAllBrands());
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      setLoadingModels(true);
      setModel("");
      getModelsByBrand(selectedBrand).then((fetchedModels) => {
        setModels(fetchedModels);
        setLoadingModels(false);
      });
    } else {
      setModels([]);
      setModel("");
    }
  }, [selectedBrand]);

  const handleSearch = () => {
    onSearch(selectedBrand, model, selectedBudget || 1000000);
  };

  const handleVoiceResult = useCallback((transcript: string) => {
    const parsed = parseVoiceTranscript(transcript, brands);
    if (parsed.brand) setSelectedBrand(parsed.brand);
    if (parsed.maxBudget) setSelectedBudget(parsed.maxBudget);
    setModel(parsed.remainingText);

    setTimeout(() => {
      onSearch(
        parsed.brand || selectedBrand,
        parsed.remainingText,
        parsed.maxBudget || selectedBudget || 1000000,
        parsed.maxMileage,
        parsed.fuelType,
        parsed.transmission,
        parsed.euroNorm,
        parsed.color,
      );
    }, 500);
  }, [brands, selectedBrand, selectedBudget, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  /** Trust pills below search */
  const trustPills = [
    { icon: ShieldCheck, labelFr: "Annonces vérifiées", labelNl: "Geverifieerde advertenties" },
    { icon: FileCheck, labelFr: "Car-Pass protégé", labelNl: "Car-Pass beschermd" },
    { icon: Leaf, labelFr: "Conformité LEZ garantie", labelNl: "LEZ-compatibiliteit gegarandeerd" },
  ];

  return (
    <section
      className="relative min-h-[55vh] sm:min-h-[75vh] flex items-center justify-center pt-8 sm:pt-16 pb-8 sm:pb-16 overflow-hidden"
      style={{ contain: "layout style" }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-secondary/40" />

      {/* Parallax decorative orbs */}
      <div
        className="hidden sm:block absolute top-1/4 left-[10%] w-[32rem] h-[32rem] bg-primary/[0.10] rounded-full blur-[120px]"
        style={{ transform: `translateY(${parallaxOffset * 0.6}px)` }}
      />
      <div
        className="hidden sm:block absolute bottom-[5%] right-[8%] w-[26rem] h-[26rem] bg-primary/[0.06] rounded-full blur-[100px]"
        style={{ transform: `translateY(${-parallaxOffset * 0.4}px)` }}
      />
      <div
        className="hidden md:block absolute top-[10%] right-[18%] w-72 h-72 bg-primary/[0.05] rounded-full blur-[80px]"
        style={{ transform: `translateY(${parallaxOffset * 0.8}px)` }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "48px 48px",
          transform: `translateY(${parallaxOffset * 0.1}px)`,
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
            {t("hero.badge")}
          </motion.div>

          {/* Headline — premium copy */}
          <motion.h1
            {...fadeUp(0.1)}
            className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold text-foreground mb-4 sm:mb-6 leading-[1.08] tracking-tight"
          >
            {isNl ? (
              <>
                De perfecte auto voor uw
                <br />
                <span className="gradient-text">leven in België</span>
              </>
            ) : (
              <>
                La voiture parfaite pour votre
                <br />
                <span className="gradient-text">vie en Belgique</span>
              </>
            )}
          </motion.h1>

          {/* Subheadline — trust-focused */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 px-2 leading-relaxed"
          >
            {isNl
              ? "Geen verrassingen. Elke advertentie is geverifieerd met Car-Pass, LEZ-compatibiliteit en regionale belastingberekening."
              : "Sans aucune mauvaise surprise. Chaque annonce est vérifiée Car-Pass, conforme LEZ et accompagnée du calcul fiscal régional."}
          </motion.p>

          {/* Search Box */}
          <motion.div
            {...fadeUp(0.35)}
            className="glass-panel p-3 sm:p-4 md:p-5 max-w-3xl mx-auto ring-1 ring-white/10"
            role="search"
            aria-label={isNl ? "Snel zoeken naar voertuigen" : "Recherche rapide de véhicules"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {/* Brand */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="search-input w-full appearance-none cursor-pointer pr-8 sm:pr-10 text-sm sm:text-base py-3 sm:py-4 bg-card"
                  aria-label={isNl ? "Selecteer een merk" : "Sélectionner une marque"}
                >
                  <option value="">{t("filters.brand")}</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Model */}
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="search-input w-full appearance-none cursor-pointer pr-8 sm:pr-10 text-sm sm:text-base py-3 sm:py-4 bg-card"
                  disabled={!selectedBrand}
                  aria-label={isNl ? "Selecteer een model" : "Sélectionner un modèle"}
                >
                  <option value="">
                    {selectedBrand ? t("filters.allModels") : t("filters.model")}
                  </option>
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Budget */}
              <div className="relative">
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className="search-input w-full appearance-none cursor-pointer pr-8 sm:pr-10 text-sm sm:text-base py-3 sm:py-4 bg-card"
                  aria-label={isNl ? "Selecteer een budget" : "Sélectionner un budget"}
                >
                  <option value={0}>{t("filters.budget")}</option>
                  {BUDGET_OPTIONS.map((budget) => (
                    <option key={budget.value} value={budget.value}>{budget.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Search & Voice */}
              <div className="sm:col-span-2 md:col-span-1 flex gap-2 min-w-0 overflow-hidden">
                <VoiceSearchButton onResult={handleVoiceResult} />
                <button
                  onClick={handleSearch}
                  className="btn-primary-gradient flex-1 min-w-0 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-md overflow-hidden"
                  aria-label={isNl ? "Zoeken" : "Lancer la recherche"}
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-sm sm:text-base truncate">{t("hero.search")}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Trust pills */}
          <motion.div
            {...fadeUp(0.5)}
            className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-6 sm:mt-10"
          >
            {trustPills.map((pill, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground"
              >
                <pill.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>{isNl ? pill.labelNl : pill.labelFr}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default HeroSearch;
