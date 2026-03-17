/**
 * HeroSearch component — immersive hero with parallax, premium copy, trust signals & 90% badge
 * On mobile: tap opens fullscreen search modal with suggestions & swipeable filters
 * @module features/search/components
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, ShieldCheck, FileCheck, Leaf, X, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUDGET_OPTIONS } from "../types/search.types";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { parseVoiceTranscript } from "@/lib/voiceEntityDetection";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── localStorage search history ─── */
const HISTORY_KEY = "autora_search_history";
const MAX_HISTORY = 8;

interface SearchEntry {
  brand: string;
  model: string;
  budget: number;
  timestamp: number;
}

function getSearchHistory(): SearchEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

function addSearchHistory(entry: Omit<SearchEntry, "timestamp">) {
  if (!entry.brand && !entry.model) return;
  const history = getSearchHistory().filter(
    (h) => !(h.brand === entry.brand && h.model === entry.model)
  );
  history.unshift({ ...entry, timestamp: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/* ─── Parallax hook ─── */
function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { setOffset(window.scrollY * speed); ticking = false; });
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

/* ─── Animated counter ─── */
function AnimatedPercent({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const triggered = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
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
    }, { rootMargin: "-20px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{display}</span>;
}

/* ─── Popular quick-search chips ─── */
const TRENDING_SEARCHES = [
  { brand: "Volkswagen", model: "Golf", label: "VW Golf" },
  { brand: "BMW", model: "Série 3", label: "BMW Série 3" },
  { brand: "Peugeot", model: "308", label: "Peugeot 308" },
  { brand: "Audi", model: "A3", label: "Audi A3" },
  { brand: "Renault", model: "Clio", label: "Renault Clio" },
  { brand: "Mercedes", model: "Classe A", label: "Mercedes A" },
];

/* ─── Fullscreen Mobile Search Modal ─── */
interface FullscreenSearchProps {
  isOpen: boolean;
  onClose: () => void;
  brands: string[];
  onSearch: (brand: string, model: string, maxPrice: number) => void;
  t: (key: string) => string;
}

function FullscreenSearch({ isOpen, onClose, brands, onSearch, t }: FullscreenSearchProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState(0);
  const [models, setModels] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"brand" | "budget">("brand");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory(getSearchHistory());
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (brand) {
      getModelsByBrand(brand).then(setModels);
      setModel("");
    } else {
      setModels([]);
    }
  }, [brand]);

  const handleSubmit = () => {
    addSearchHistory({ brand, model, budget });
    onSearch(brand, model, budget || 1000000);
    onClose();
  };

  const handleHistoryClick = (entry: SearchEntry) => {
    onSearch(entry.brand, entry.model, entry.budget || 1000000);
    onClose();
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-[80] bg-background flex flex-col safe-top"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={brand ? `${brand}${model ? ` ${model}` : ""}` : ""}
                readOnly
                placeholder={t("hero.search") || "Rechercher une voiture..."}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {(brand || model || budget > 0) && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 active:scale-95 transition-transform"
              >
                {t("hero.search")}
              </button>
            )}
          </div>

          {/* Swipeable filter tabs */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {[
              { key: "brand" as const, label: t("filters.brand") || "Marque" },
              { key: "budget" as const, label: t("filters.budget") || "Budget" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {tab.label}
                {tab.key === "brand" && brand && (
                  <span className="ml-1.5 text-xs opacity-80">· {brand}</span>
                )}
                {tab.key === "budget" && budget > 0 && (
                  <span className="ml-1.5 text-xs opacity-80">· {budget.toLocaleString("fr-BE")}€</span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-24">
            {/* Brand tab */}
            {activeTab === "brand" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Selected brand → show models */}
                {brand ? (
                  <div>
                    <button
                      onClick={() => setBrand("")}
                      className="flex items-center gap-2 text-sm text-primary font-medium mb-3"
                    >
                      ← {t("filters.brand") || "Marques"}
                    </button>
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                      {brand} — {t("filters.model") || "Modèle"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setModel(""); setActiveTab("budget"); }}
                        className={`px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                          !model ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-foreground"
                        }`}
                      >
                        {t("filters.allModels") || "Tous"}
                      </button>
                      {models.map((m) => (
                        <button
                          key={m}
                          onClick={() => { setModel(m); setActiveTab("budget"); }}
                          className={`px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                            model === m ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-foreground"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Trending searches */}
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Tendances
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {TRENDING_SEARCHES.map((ts) => (
                        <button
                          key={ts.label}
                          onClick={() => {
                            setBrand(ts.brand);
                            setModel(ts.model);
                            setActiveTab("budget");
                          }}
                          className="px-3.5 py-2 rounded-full bg-primary/8 text-primary text-sm font-medium border border-primary/15 active:scale-95 transition-transform"
                        >
                          {ts.label}
                        </button>
                      ))}
                    </div>

                    {/* All brands */}
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                      {t("filters.brand") || "Marque"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {brands.map((b) => (
                        <button
                          key={b}
                          onClick={() => setBrand(b)}
                          className="px-4 py-3 rounded-2xl bg-secondary text-foreground text-sm font-medium text-left hover:bg-secondary/80 active:scale-[0.98] transition-all flex items-center justify-between"
                        >
                          {b}
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Budget tab */}
            {activeTab === "budget" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                  {t("filters.budget") || "Budget maximum"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBudget(0)}
                    className={`px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                      budget === 0 ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-foreground"
                    }`}
                  >
                    {t("filters.noBudgetLimit") || "Pas de limite"}
                  </button>
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setBudget(opt.value)}
                      className={`px-4 py-3 rounded-2xl text-sm font-medium text-left transition-all ${
                        budget === opt.value ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Search history */}
            {history.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {t("hero.recentSearches") || "Recherches récentes"}
                  </p>
                  <button onClick={handleClearHistory} className="text-xs text-destructive font-medium">
                    {t("common.clear") || "Effacer"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {history.map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => handleHistoryClick(entry)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/50 hover:bg-secondary text-left transition-colors"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {entry.brand}{entry.model ? ` ${entry.model}` : ""}
                        </span>
                        {entry.budget > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            &lt; {entry.budget.toLocaleString("fr-BE")}€
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-xl shadow-primary/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {t("hero.search") || "Rechercher"}
              {(brand || budget > 0) && (
                <span className="text-sm opacity-80">
                  {[brand, model, budget > 0 ? `< ${budget.toLocaleString("fr-BE")}€` : ""].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main HeroSearch ─── */
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { t } = useLanguage();
  const parallaxOffset = useParallax(0.25);
  const isMobile = useIsMobile();

  useEffect(() => { setBrands(getAllBrands()); }, []);

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
    addSearchHistory({ brand: selectedBrand, model, budget: selectedBudget });
    onSearch(selectedBrand, model, selectedBudget || 1000000);
  };

  const handleMobileSearch = useCallback((brand: string, mdl: string, maxPrice: number) => {
    setSelectedBrand(brand);
    setModel(mdl);
    setSelectedBudget(maxPrice >= 1000000 ? 0 : maxPrice);
    addSearchHistory({ brand, model: mdl, budget: maxPrice >= 1000000 ? 0 : maxPrice });
    onSearch(brand, mdl, maxPrice);
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [onSearch]);

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
        parsed.maxMileage, parsed.fuelType, parsed.transmission, parsed.euroNorm, parsed.color,
      );
    }, 500);
  }, [brands, selectedBrand, selectedBudget, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const trustPills = [
    { icon: ShieldCheck, label: t("hero.pill.verified") },
    { icon: FileCheck, label: t("hero.pill.carpass") },
    { icon: Leaf, label: t("hero.pill.lez") },
  ];

  return (
    <>
      <section
        className="relative min-h-[55vh] sm:min-h-[75vh] flex items-center justify-center pt-8 sm:pt-16 pb-8 sm:pb-16 overflow-hidden"
        style={{ contain: "layout style" }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02]" />

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="hero-particle hero-particle-1" />
          <div className="hero-particle hero-particle-2" />
          <div className="hero-particle hero-particle-3" />
          <div className="hero-particle hero-particle-4" />
          <div className="hero-particle hero-particle-5" />
          <div className="hidden sm:block hero-particle hero-particle-6" />
          <div className="hidden sm:block hero-particle hero-particle-7" />
          <div className="hidden md:block hero-particle hero-particle-8" />
        </div>

        {/* Parallax orbs */}
        <div className="hidden sm:block absolute top-1/4 left-[10%] w-[32rem] h-[32rem] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, hsl(160 84% 39% / 0.12), hsl(180 60% 42% / 0.06), transparent)', transform: `translateY(${parallaxOffset * 0.6}px)` }} />
        <div className="hidden sm:block absolute bottom-[5%] right-[8%] w-[26rem] h-[26rem] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, hsl(140 70% 45% / 0.08), hsl(200 50% 50% / 0.04), transparent)', transform: `translateY(${-parallaxOffset * 0.4}px)` }} />
        <div className="hidden md:block absolute top-[10%] right-[18%] w-72 h-72 rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, hsl(170 80% 45% / 0.07), hsl(160 60% 50% / 0.03), transparent)', transform: `translateY(${parallaxOffset * 0.8}px)` }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`, backgroundSize: "48px 48px", transform: `translateY(${parallaxOffset * 0.1}px)` }} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-8 sm:mb-10 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t("hero.badge")}
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fadeUp(0.1)}
              className="font-display text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-5 sm:mb-6 leading-[1.1] tracking-tight">
              {t("hero.titleLine1")}<br />
              <span className="gradient-text">{t("hero.titleLine2")}</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p {...fadeUp(0.18)}
              className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium tracking-wide mb-6 sm:mb-8">
              {t("hero.subtitleTrust")}
            </motion.p>

            {/* 90% Trust Badge */}
            <motion.div {...fadeUp(0.26)}
              className="inline-flex flex-col items-center gap-1 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-amber-400/[0.04] to-transparent border border-amber-500/20 backdrop-blur-sm mb-10 sm:mb-14 shadow-[0_8px_32px_-8px_rgba(245,158,11,0.12)]">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl md:text-6xl font-black text-amber-400 tabular-nums">
                  <AnimatedPercent target={90} />
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-amber-400/80">%</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">{t("hero.trustBadge")}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{t("hero.trustBadgeSub")}</span>
            </motion.div>

            {/* Search Box — Mobile: tap to open fullscreen */}
            {isMobile ? (
              <motion.button
                {...fadeUp(0.35)}
                onClick={() => setMobileSearchOpen(true)}
                className="glass-panel p-4 max-w-3xl mx-auto ring-1 ring-white/10 w-full flex items-center gap-3 active:scale-[0.98] transition-transform"
                role="search"
                aria-label={t("hero.search")}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm text-left flex-1">
                  {t("hero.searchPlaceholder") || "Marque, modèle, budget..."}
                </span>
                <VoiceSearchButton onResult={handleVoiceResult} />
              </motion.button>
            ) : (
              <motion.div
                {...fadeUp(0.35)}
                className="glass-panel p-3 sm:p-4 md:p-5 max-w-3xl mx-auto ring-1 ring-white/10 border border-slate-800 shadow-xl overflow-hidden"
                role="search"
                aria-label={t("hero.search")}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  {/* Brand */}
                  <div className="relative">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} onKeyDown={handleKeyDown}
                      className="search-input w-full appearance-none cursor-pointer pr-10 text-base py-4 bg-card" aria-label={t("filters.brand")}>
                      <option value="">{t("filters.brand")}</option>
                      {brands.map((brand) => (<option key={brand} value={brand}>{brand}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Model */}
                  <div className="relative">
                    <select value={model} onChange={(e) => setModel(e.target.value)} onKeyDown={handleKeyDown}
                      className="search-input w-full appearance-none cursor-pointer pr-10 text-base py-4 bg-card" disabled={!selectedBrand} aria-label={t("filters.model")}>
                      <option value="">{selectedBrand ? t("filters.allModels") : t("filters.model")}</option>
                      {models.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Budget */}
                  <div className="relative">
                    <select value={selectedBudget} onChange={(e) => setSelectedBudget(Number(e.target.value))} onKeyDown={handleKeyDown}
                      className="search-input w-full appearance-none cursor-pointer pr-10 text-base py-4 bg-card" aria-label={t("filters.budget")}>
                      <option value={0}>{t("filters.budget")}</option>
                      {BUDGET_OPTIONS.map((budget) => (<option key={budget.value} value={budget.value}>{budget.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Search & Voice */}
                  <div className="sm:col-span-2 md:col-span-1 flex gap-2 min-w-0 overflow-hidden">
                    <VoiceSearchButton onResult={handleVoiceResult} />
                    <button onClick={handleSearch}
                      className="btn-primary-gradient flex-1 min-w-0 flex items-center justify-center gap-2 py-4 rounded-md overflow-hidden" aria-label={t("hero.search")}>
                      <Search className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span className="font-semibold text-base truncate">{t("hero.search")}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trust pills */}
            <motion.div {...fadeUp(0.5)} className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-6 sm:mt-10">
              {trustPills.map((pill, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <pill.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  <span>{pill.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Fullscreen mobile search modal */}
      <FullscreenSearch
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        brands={brands}
        onSearch={handleMobileSearch}
        t={t}
      />
    </>
  );
});

export default HeroSearch;
