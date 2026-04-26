/**
 * HeroSearch — ultra-premium minimal hero with serif typography & glassmorphic search
 * @module features/search/components
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, X, Clock, TrendingUp, ArrowRight, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUDGET_OPTIONS } from "../types/search.types";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { parseVoiceTranscript } from "@/lib/voiceEntityDetection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";

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

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

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
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
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
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            {(brand || model || budget > 0) && (
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform"
              >
                {t("hero.search")}
              </button>
            )}
          </div>

          {/* Swipeable filter tabs */}
          <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-hide">
            {[
              { key: "brand" as const, label: t("filters.brand") || "Marque" },
              { key: "budget" as const, label: t("filters.budget") || "Budget" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-light whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground"
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
          <div className="flex-1 overflow-y-auto px-5 pb-28">
            {activeTab === "brand" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {brand ? (
                  <div>
                    <button
                      onClick={() => setBrand("")}
                      className="flex items-center gap-2 text-sm text-primary font-light mb-4"
                    >
                      ← {t("filters.brand") || "Marques"}
                    </button>
                    <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.15em] font-light">
                      {brand} — {t("filters.model") || "Modèle"}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => { setModel(""); setActiveTab("budget"); }}
                        className={`px-4 py-3.5 rounded-3xl text-sm font-light text-left transition-all ${
                          !model ? "bg-primary/8 text-primary border border-primary/15" : "bg-secondary/40 text-foreground"
                        }`}
                      >
                        {t("filters.allModels") || "Tous"}
                      </button>
                      {models.map((m) => (
                        <button
                          key={m}
                          onClick={() => { setModel(m); setActiveTab("budget"); }}
                          className={`px-4 py-3.5 rounded-3xl text-sm font-light text-left transition-all ${
                            model === m ? "bg-primary/8 text-primary border border-primary/15" : "bg-secondary/40 text-foreground"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.15em] font-light flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      Tendances
                    </p>
                    <div className="flex flex-wrap gap-2.5 mb-8">
                      {[
                        { brand: "Volkswagen", model: "Golf", label: "VW Golf" },
                        { brand: "BMW", model: "Série 3", label: "BMW Série 3" },
                        { brand: "Peugeot", model: "308", label: "Peugeot 308" },
                        { brand: "Audi", model: "A3", label: "Audi A3" },
                        { brand: "Renault", model: "Clio", label: "Renault Clio" },
                        { brand: "Mercedes", model: "Classe A", label: "Mercedes A" },
                      ].map((ts) => (
                        <button
                          key={ts.label}
                          onClick={() => {
                            setBrand(ts.brand);
                            setModel(ts.model);
                            setActiveTab("budget");
                          }}
                          className="px-4 py-2.5 rounded-full bg-primary/5 text-primary text-sm font-light border border-primary/10 active:scale-95 transition-transform"
                        >
                          {ts.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.15em] font-light">
                      {t("filters.brand") || "Marque"}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {brands.map((b) => (
                        <button
                          key={b}
                          onClick={() => setBrand(b)}
                          className="px-4 py-3.5 rounded-3xl bg-secondary/40 text-foreground text-sm font-light text-left active:scale-[0.98] transition-all flex items-center justify-between"
                        >
                          {b}
                          <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "budget" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.15em] font-light">
                  {t("filters.budget") || "Budget maximum"}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setBudget(0)}
                    className={`px-4 py-3.5 rounded-3xl text-sm font-light text-left transition-all ${
                      budget === 0 ? "bg-primary/8 text-primary border border-primary/15" : "bg-secondary/40 text-foreground"
                    }`}
                  >
                    {t("filters.noBudgetLimit") || "Pas de limite"}
                  </button>
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setBudget(opt.value)}
                      className={`px-4 py-3.5 rounded-3xl text-sm font-light text-left transition-all ${
                        budget === opt.value ? "bg-primary/8 text-primary border border-primary/15" : "bg-secondary/40 text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {history.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {t("hero.recentSearches") || "Recherches récentes"}
                  </p>
                  <button onClick={handleClearHistory} className="text-[10px] text-destructive font-light">
                    {t("common.clear") || "Effacer"}
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => handleHistoryClick(entry)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-3xl bg-secondary/30 text-left transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-light text-foreground">
                          {entry.brand}{entry.model ? ` ${entry.model}` : ""}
                        </span>
                        {entry.budget > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            &lt; {entry.budget.toLocaleString("fr-BE")}€
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-3xl bg-primary text-primary-foreground font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {t("hero.search") || "Rechercher"}
              {(brand || budget > 0) && (
                <span className="text-sm opacity-70 font-light">
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
  const isMobile = useIsMobile();
  const prefersReduced = useReducedMotion();
  const showOrbs = !isMobile && !prefersReduced;

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

  return (
    <>
      <section
        className="relative flex items-center justify-center pt-10 sm:pt-28 pb-12 sm:pb-28 overflow-hidden min-h-[50vh] sm:min-h-[60vh]"
        style={{ contain: "layout style" }}
      >
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] via-transparent to-accent/[0.01]" />

        {/* Parallax luminous orbs — desktop only, skipped under reduced-motion to free main thread on mobile */}
        {showOrbs && (
          <>
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                top: "-10%",
                right: "-10%",
                filter: "blur(80px)",
              }}
              animate={{ y: [0, 30, 0], x: [0, -15, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute w-[350px] h-[350px] rounded-full opacity-[0.03]"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                bottom: "5%",
                left: "-5%",
                filter: "blur(60px)",
              }}
              animate={{ y: [0, -20, 0], x: [0, 20, 0], scale: [1, 1.12, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            <motion.div
              className="absolute w-[200px] h-[200px] rounded-full opacity-[0.025]"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                top: "40%",
                left: "50%",
                filter: "blur(50px)",
              }}
              animate={{ y: [0, 15, 0], x: [0, -10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            />
          </>
        )}

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)`, backgroundSize: "64px 64px" }} />

        <div className="container mx-auto px-6 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">

            {/* Badge */}
            <motion.div {...fadeUp(0)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-6 sm:mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-light text-primary tracking-wide">
                {t("hero.badge") || "Marketplace #1 en Belgique"}
              </span>
            </motion.div>

            {/* Headline — Serif, ultra-thin, generous spacing */}
            <motion.h1 {...fadeUp(0.08)}
              className="font-serif text-[2rem] sm:text-5xl md:text-[3.75rem] lg:text-7xl font-light text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight">
              {t("hero.titleLine1")}<br />
              <span className="text-primary font-normal">{t("hero.titleLine2")}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p {...fadeUp(0.14)}
              className="text-sm sm:text-base md:text-lg text-muted-foreground font-light max-w-xl mx-auto mb-8 sm:mb-12 leading-relaxed"
            >
              {t("hero.subtitle") || "Véhicules vérifiés Car-Pass · Conformité LEZ garantie · Calcul TCO régional"}
            </motion.p>

            {/* Search Box — Glassmorphic, premium */}
            {isMobile ? (
              <motion.button
                {...fadeUp(0.25)}
                onClick={() => setMobileSearchOpen(true)}
                className="w-full p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 shadow-lg hover:shadow-2xl hover:border-primary/30 flex items-center gap-4 active:scale-[0.98] transition-all duration-300"
                role="search"
                aria-label={t("hero.search")}
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-muted-foreground text-sm font-light text-left flex-1">
                  {t("hero.searchPlaceholder") || "Marque, modèle, budget..."}
                </span>
                <VoiceSearchButton onResult={handleVoiceResult} />
              </motion.button>
            ) : (
              <motion.div
                {...fadeUp(0.25)}
                className="p-4 sm:p-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl hover:shadow-2xl transition-shadow duration-500 max-w-3xl mx-auto"
                role="search"
                aria-label={t("hero.search")}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Brand */}
                  <div className="relative group">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} onKeyDown={handleKeyDown}
                      className="w-full appearance-none cursor-pointer pr-10 text-sm font-light py-4 px-4 bg-secondary/40 hover:bg-secondary/60 rounded-2xl border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200" aria-label={t("filters.brand")}>
                      <option value="">{t("filters.brand")}</option>
                      {brands.map((brand) => (<option key={brand} value={brand}>{brand}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none transition-transform group-hover:translate-y-0 group-focus-within:rotate-180" />
                  </div>

                  {/* Model */}
                  <div className="relative group">
                    <select value={model} onChange={(e) => setModel(e.target.value)} onKeyDown={handleKeyDown}
                      className="w-full appearance-none cursor-pointer pr-10 text-sm font-light py-4 px-4 bg-secondary/40 hover:bg-secondary/60 rounded-2xl border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedBrand} aria-label={t("filters.model")}>
                      <option value="">{selectedBrand ? t("filters.allModels") : t("filters.model")}</option>
                      {models.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                  </div>

                  {/* Budget */}
                  <div className="relative group">
                    <select value={selectedBudget} onChange={(e) => setSelectedBudget(Number(e.target.value))} onKeyDown={handleKeyDown}
                      className="w-full appearance-none cursor-pointer pr-10 text-sm font-light py-4 px-4 bg-secondary/40 hover:bg-secondary/60 rounded-2xl border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200" aria-label={t("filters.budget")}>
                      <option value={0}>{t("filters.budget")}</option>
                      {BUDGET_OPTIONS.map((budget) => (<option key={budget.value} value={budget.value}>{budget.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                  </div>

                  {/* Search & Voice */}
                  <div className="sm:col-span-2 md:col-span-1 flex gap-2 min-w-0 overflow-hidden">
                    <VoiceSearchButton onResult={handleVoiceResult} />
                    <button onClick={handleSearch}
                      className="flex-1 min-w-0 flex items-center justify-center gap-2 py-4 rounded-2xl text-primary-foreground font-semibold bg-primary hover:brightness-110 active:scale-[0.97] transition-all duration-200 overflow-hidden shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_12px_32px_-6px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5" aria-label={t("hero.search")}>
                      <Search className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span className="text-sm truncate">{t("hero.search")}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trust micro-row — premium belge signals */}
            <motion.div
              {...fadeUp(0.35)}
              className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-muted-foreground font-light"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                {t("hero.trustCarpass") || "Car-Pass vérifié"}
              </span>
              <span className="hidden sm:inline-block w-px h-3 bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                {t("hero.trustLez") || "LEZ Belgique"}
              </span>
              <span className="hidden sm:inline-block w-px h-3 bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                {t("hero.trustBelgian") || "100% belge"}
              </span>
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
