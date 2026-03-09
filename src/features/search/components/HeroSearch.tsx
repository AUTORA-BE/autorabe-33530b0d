/**
 * HeroSearch component - immersive hero with parallax and staggered entrance
 * @module features/search/components
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUDGET_OPTIONS } from "../types/search.types";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import type { QuickSearchParams } from "../types/search.types";

/** Animated counter that increments when visible in viewport */
function AnimatedCounter({ target, suffix = "", duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

export interface HeroSearchProps {
  onSearch: (brand: string, model: string, maxPrice: number, maxMileage?: number, fuelType?: string) => void;
}

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

const HeroSearch = memo(function HeroSearch({ onSearch }: HeroSearchProps) {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<number>(0);
  const [model, setModel] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const { t } = useLanguage();
  const parallaxOffset = useParallax(0.25);

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
    const lowerTranscript = transcript.toLowerCase();
    
    let newBrand = selectedBrand;
    let newBudget = selectedBudget;
    let newMileage: number | undefined;
    
    const foundBrand = brands.find(b => lowerTranscript.includes(b.toLowerCase()));
    if (foundBrand) {
      newBrand = foundBrand;
      setSelectedBrand(foundBrand);
    }
    
    const numberMatch = lowerTranscript.match(/(\d+[\s.]?\d*)\s*(euro|€|mille)/i);
    let budget = 0;
    if (numberMatch) {
       budget = parseInt(numberMatch[1].replace(/\D/g, ''));
       if (lowerTranscript.includes("mille")) budget *= 1000;
       else if (budget < 1000 && budget > 0) budget *= 1000;
       
       const option = BUDGET_OPTIONS.find(o => o.value >= budget);
       if (option) {
          newBudget = option.value;
          setSelectedBudget(option.value);
       } else {
          newBudget = 1000000;
          setSelectedBudget(1000000);
       }
    }

    const kmMatch = lowerTranscript.match(/(\d+[\s.]?\d*)\s*(km|kilomètre|kilometer|kilo)/i);
    if (kmMatch) {
      newMileage = parseInt(kmMatch[1].replace(/\D/g, ''));
      if (newMileage < 1000 && newMileage > 0) newMileage *= 1000;
    }

    let potentialModel = transcript
      .replace(new RegExp(foundBrand || '', 'ig'), '')
      .replace(new RegExp(numberMatch ? numberMatch[0] : '', 'ig'), '')
      .replace(new RegExp(kmMatch ? kmMatch[0] : '', 'ig'), '')
      .replace(/(moins de|budget|euros|€|prix|maximum|max|kilomètres|kilometers)/ig, '')
      .trim();
      
    setModel(potentialModel);
    
    setTimeout(() => {
      onSearch(newBrand, potentialModel, newBudget || 1000000, newMileage);
    }, 500);
  }, [brands, selectedBrand, selectedBudget, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section
      className="relative min-h-[60vh] sm:min-h-[80vh] flex items-center justify-center pt-10 sm:pt-20 pb-10 sm:pb-20 overflow-hidden"
      style={{ contain: "layout style" }}
    >
      {/* Background gradient — richer */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-secondary/40" />

      {/* Parallax decorative orbs — more prominent */}
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

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.1)}
            className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-[5rem] font-extrabold text-foreground mb-4 sm:mb-7 leading-[1.08] tracking-tight"
          >
            {t("hero.title1")}
            <br />
            <span className="gradient-text">{t("hero.title2")}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-14 px-2 leading-relaxed"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* Search Box */}
          <motion.div
            {...fadeUp(0.35)}
            className="glass-panel p-3 sm:p-4 md:p-5 max-w-3xl mx-auto ring-1 ring-white/10"
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
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Model Select */}
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
                    <option key={m} value={m}>{m}</option>
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
                    <option key={budget.value} value={budget.value}>{budget.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Search & Voice Buttons */}
              <div className="col-span-2 md:col-span-1 flex gap-2">
                <VoiceSearchButton onResult={handleVoiceResult} />
                <button
                  onClick={handleSearch}
                  className="btn-primary-gradient flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-md"
                  aria-label="Lancer la recherche"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  <span className="font-semibold text-sm sm:text-base">{t("hero.search")}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            {...fadeUp(0.5)}
            className="flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-20 mt-8 sm:mt-14"
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
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default HeroSearch;
