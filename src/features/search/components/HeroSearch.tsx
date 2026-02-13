/**
 * HeroSearch component - main hero section with quick search form
 * @module features/search/components
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUDGET_OPTIONS } from "../types/search.types";
import type { QuickSearchParams } from "../types/search.types";

/** Animated counter that increments when visible in viewport */
function AnimatedCounter({ target, suffix = "", duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/**
 * Props for the HeroSearch component
 */
export interface HeroSearchProps {
  /** Callback when search is submitted */
  onSearch: (brand: string, model: string, maxPrice: number) => void;
}

/**
 * HeroSearch displays the main hero section with headline, stats,
 * and a quick search form for brand, model, and budget
 */
const HeroSearch = memo(function HeroSearch({ onSearch }: HeroSearchProps) {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<number>(0);
  const [model, setModel] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setBrands(getAllBrands());
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      setLoadingModels(true);
      setModel(""); // Reset model when brand changes
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const decorY1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const decorY2 = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden">
      {/* Background gradient with parallax */}
      <motion.div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" style={{ y: bgY }} />

      {/* Decorative elements with parallax */}
      <motion.div
        className="hidden sm:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"
        style={{ y: decorY1 }}
      />
      <motion.div
        className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float"
        style={{ y: decorY2, animationDelay: "-3s" }}
      />

      <motion.div className="container mx-auto px-4 sm:px-6 relative z-10" style={{ y: contentY, opacity: contentOpacity }}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
            {t("hero.badge")}
          </div>

          {/* Headline */}
          <h1
            className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 animate-fade-up leading-tight"
            style={{ animationDelay: "0.1s" }}
          >
            {t("hero.title1")}
            <br />
            <span className="gradient-text">{t("hero.title2")}</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 animate-fade-up px-2"
            style={{ animationDelay: "0.2s" }}
          >
            {t("hero.subtitle")}
          </p>

          {/* Search Box */}
          <div
            className="glass-panel p-3 sm:p-4 md:p-5 max-w-3xl mx-auto animate-fade-up ring-1 ring-white/10"
            style={{ animationDelay: "0.3s" }}
            role="search"
            aria-label="Recherche rapide de véhicules"
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {/* Brand Select */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="search-input w-full appearance-none cursor-pointer pr-8 sm:pr-10 text-sm sm:text-base py-3 sm:py-4 bg-card"
                  aria-label="Sélectionner une marque"
                >
                  <option value="">{t("filters.brand")}</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Model Select - Dynamic based on brand */}
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="search-input w-full appearance-none cursor-pointer pr-8 sm:pr-10 text-sm sm:text-base py-3 sm:py-4 bg-card"
                  disabled={!selectedBrand}
                  aria-label="Sélectionner un modèle"
                >
                  <option value="">
                    {selectedBrand ? t("filters.allModels") : t("filters.model")}
                  </option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Budget Select */}
              <div className="relative">
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className="search-input w-full appearance-none cursor-pointer pr-8 sm:pr-10 text-sm sm:text-base py-3 sm:py-4 bg-card"
                  aria-label="Sélectionner un budget"
                >
                  <option value={0}>{t("filters.budget")}</option>
                  {BUDGET_OPTIONS.map((budget) => (
                    <option key={budget.value} value={budget.value}>
                      {budget.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="btn-primary-gradient flex items-center justify-center gap-2 col-span-2 md:col-span-1 py-3 sm:py-4"
                aria-label="Lancer la recherche"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                <span className="font-semibold text-sm sm:text-base">{t("hero.search")}</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-16 mt-8 sm:mt-12 animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                <AnimatedCounter target={150} suffix="+" />
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">{t("hero.vehicles")}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                <AnimatedCounter target={98} suffix="%" />
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">{t("hero.verified")}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                <AnimatedCounter target={50} suffix="+" />
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">{t("hero.brands")}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
});

export default HeroSearch;
