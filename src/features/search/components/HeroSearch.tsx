/**
 * HeroSearch component — immersive hero with parallax, premium copy, trust signals & 90% badge
 * @module features/search/components
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, ShieldCheck, FileCheck, Leaf, Award } from "lucide-react";
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

/** Animated counter for the 90% badge */
function AnimatedPercent({ target }: { target: number }) {
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
            const progress = Math.min((now - startTime) / 1600, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { rootMargin: "-20px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{display}</span>;
}

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
    { icon: ShieldCheck, label: t("hero.pill.verified") },
    { icon: FileCheck, label: t("hero.pill.carpass") },
    { icon: Leaf, label: t("hero.pill.lez") },
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
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-8 sm:mb-10 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t("hero.badge")}
          </motion.div>

          {/* Headline — short, punchy */}
          <motion.h1
            {...fadeUp(0.1)}
            className="font-display text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-5 sm:mb-6 leading-[1.1] tracking-tight"
          >
            {t("hero.titleLine1")}
            <br />
            <span className="gradient-text">{t("hero.titleLine2")}</span>
          </motion.h1>

          {/* Subheadline — 3 pillars */}
          <motion.p
            {...fadeUp(0.18)}
            className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium tracking-wide mb-6 sm:mb-8"
          >
            {t("hero.subtitleTrust")}
          </motion.p>

          {/* 90% Trust Badge — premium design */}
          <motion.div
            {...fadeUp(0.26)}
            className="inline-flex flex-col items-center gap-1 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-amber-400/[0.04] to-transparent border border-amber-500/20 backdrop-blur-sm mb-10 sm:mb-14 shadow-[0_8px_32px_-8px_rgba(245,158,11,0.12)]"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl md:text-6xl font-black text-amber-400 tabular-nums">
                <AnimatedPercent target={90} />
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-amber-400/80">%</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
              {t("hero.trustBadge")}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {t("hero.trustBadgeSub")}
            </span>
          </motion.div>

          {/* Search Box */}
          <motion.div
            {...fadeUp(0.35)}
            className="glass-panel p-3 sm:p-4 md:p-5 max-w-3xl mx-auto ring-1 ring-white/10 overflow-hidden"
            role="search"
            aria-label={t("hero.search")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {/* Brand */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="search-input w-full appearance-none cursor-pointer pr-8 sm:pr-10 text-sm sm:text-base py-3 sm:py-4 bg-card"
                  aria-label={t("filters.brand")}
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
                  aria-label={t("filters.model")}
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
                  aria-label={t("filters.budget")}
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
                  aria-label={t("hero.search")}
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
                <span>{pill.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default HeroSearch;
