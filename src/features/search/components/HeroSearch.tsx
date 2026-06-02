/**
 * HeroSearch — ultra-premium minimal hero with serif typography & glassmorphic search
 * @module features/search/components
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronDown, X, Clock, TrendingUp, ArrowRight, ShieldCheck, MapPin, Sparkles, Car, Truck, Caravan, GitCompareArrows } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { getAllBrands, getModelsByBrand } from "@/utils/carUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUDGET_OPTIONS } from "../types/search.types";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { parseVoiceTranscript } from "@/lib/voiceEntityDetection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { trackEvent, EVENTS } from "@/lib/analytics";

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
            <button onClick={onClose} aria-label="Fermer la recherche" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-foreground" aria-hidden="true" />
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
  const [_loadingModels, setLoadingModels] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const prefersReduced = useReducedMotion();
  const navigate = useNavigate();

  /** Build /recherche URL with query params matching useFiltersUrlSync keys */
  const buildSearchUrl = useCallback(
    (brand: string, model: string, maxPrice: number) => {
      const params = new URLSearchParams();
      if (brand) params.set("brand", brand);
      if (model) params.set("model", model);
      if (maxPrice && maxPrice < 1000000) params.set("pmax", String(maxPrice));
      const qs = params.toString();
      return qs ? `/recherche?${qs}` : "/recherche";
    },
    [],
  );

  // Parallax — photo scrolls slower than viewport
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, prefersReduced ? 0 : 120]);
  const overlayOpacity = useTransform(scrollY, [0, 500], [0.55, 0.85]);
  const contentY = useTransform(scrollY, [0, 600], [0, prefersReduced ? 0 : -40]);

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
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      brand: selectedBrand || undefined,
      model: model || undefined,
      max_price: selectedBudget || undefined,
      source: "hero",
    });
    onSearch(selectedBrand, model, selectedBudget || 1000000);
  };

  const handleMobileSearch = useCallback((brand: string, mdl: string, maxPrice: number) => {
    setSelectedBrand(brand);
    setModel(mdl);
    setSelectedBudget(maxPrice >= 1000000 ? 0 : maxPrice);
    addSearchHistory({ brand, model: mdl, budget: maxPrice >= 1000000 ? 0 : maxPrice });
    trackEvent(EVENTS.SEARCH_PERFORMED, {
      brand: brand || undefined,
      model: mdl || undefined,
      max_price: maxPrice,
      source: "mobile",
    });
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

  const handleBodyType = (bodyType: string) => {
    trackEvent(EVENTS.SEARCH_PERFORMED, { body_type: bodyType, source: "hero-bodytype" });
    onSearch("", "", 1000000);
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const bodyTypes = [
    { key: "Berline", label: t("bodyType.sedan") || "Berline", Icon: Car },
    { key: "SUV", label: "SUV", Icon: Truck },
    { key: "Break", label: t("bodyType.wagon") || "Break", Icon: Caravan },
    { key: "Citadine", label: t("bodyType.compact") || "Citadine", Icon: Car },
  ];

  return (
    <>
      <section
        ref={heroRef}
        className="relative flex flex-col justify-end overflow-hidden min-h-[88vh] sm:min-h-[92vh]"
        style={{ contain: "layout style" }}
      >
        {/* ── Immersive background photo with parallax ── */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: imgY }}
        >
          <img
            src="/hero-marketplace.jpg"
            alt=""
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="w-full h-[115%] object-cover object-center"
          />
        </motion.div>

        {/* Dark gradient overlay (bottom → top, darker on scroll) */}
        <motion.div
          className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/70 to-black/20"
          style={{ opacity: overlayOpacity }}
        />
        {/* Soft vignette + brand glow on the right */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 80% 30%, hsl(160 84% 30% / 0.15) 0%, transparent 55%)",
          }}
        />

        {/* ── Editorial title (left-aligned, white) ── */}
        <motion.div
          style={{ y: contentY }}
          className="container mx-auto px-6 sm:px-10 relative z-10 pb-32 sm:pb-44 pt-24 sm:pt-32"
        >
          <div className="max-w-2xl">
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85">
                {t("hero.badge") || "Marketplace #1 en Belgique"}
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.08)}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 sm:mb-6 leading-[1.05] tracking-tight drop-shadow-lg"
            >
              {t("hero.titleLine1")}<br />
              <span className="text-primary font-light">{t("hero.titleLine2")}</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.14)}
              className="text-sm sm:text-base font-light text-white/65 max-w-xl leading-relaxed"
            >
              {t("hero.subtitle") || "Véhicules vérifiés Car-Pass · Conformité LEZ garantie · Calcul TCO régional"}
            </motion.p>

            {/* Trust micro-row */}
            <motion.div
              {...fadeUp(0.2)}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-white/70 font-light"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                {t("hero.trustCarpass") || "Car-Pass vérifié"}
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                {t("hero.trustLez") || "LEZ Belgique"}
              </span>
              <span className="hidden sm:inline-block w-px h-3 bg-white/20" />
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                {t("hero.trustBelgian") || "100% belge"}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Floating marketplace action cards — bottom of hero ──
             Mobile: pb-28 leaves breathing room above the BottomNav (~72px tall)
             so the search bar isn't visually "eaten" by the nav. */}
        <div className="container mx-auto px-6 sm:px-10 relative z-10 pb-28 sm:pb-14">
          {isMobile ? (
            <motion.button
              {...fadeUp(0.25)}
              onClick={() => setMobileSearchOpen(true)}
              className="w-full p-4 rounded-2xl bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-white/40 shadow-2xl flex items-center gap-3 active:scale-[0.98] transition-all"
              role="search"
              aria-label={t("hero.search")}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <span className="text-foreground/70 text-sm font-light text-left flex-1">
                {t("hero.searchPlaceholder") || "Marque, modèle, budget..."}
              </span>
              <VoiceSearchButton onResult={handleVoiceResult} />
            </motion.button>
          ) : (
            <motion.div
              {...fadeUp(0.3)}
              className="grid grid-cols-12 gap-4"
            >
              {/* Card 1 — Quick search (wider) */}
              <div className="col-span-12 lg:col-span-7 p-5 rounded-2xl bg-white/95 dark:bg-card/90 backdrop-blur-xl border border-white/40 dark:border-border/40 shadow-2xl hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.4)] transition-shadow duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                  <span className="text-[11px] font-medium text-foreground/80 uppercase tracking-wider">
                    {t("hero.quickSearch") || "Recherche rapide"}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="relative group">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} onKeyDown={handleKeyDown}
                      className="w-full appearance-none cursor-pointer pr-8 text-sm font-light py-3 px-3 bg-secondary/50 hover:bg-secondary rounded-xl border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" aria-label={t("filters.brand")}>
                      <option value="">{t("filters.brand")}</option>
                      {brands.map((brand) => (<option key={brand} value={brand}>{brand}</option>))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  <div className="relative group">
                    <select value={model} onChange={(e) => setModel(e.target.value)} onKeyDown={handleKeyDown}
                      className="w-full appearance-none cursor-pointer pr-8 text-sm font-light py-3 px-3 bg-secondary/50 hover:bg-secondary rounded-xl border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" disabled={!selectedBrand} aria-label={t("filters.model")}>
                      <option value="">{selectedBrand ? t("filters.allModels") : t("filters.model")}</option>
                      {models.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  <div className="relative group">
                    <select value={selectedBudget} onChange={(e) => setSelectedBudget(Number(e.target.value))} onKeyDown={handleKeyDown}
                      className="w-full appearance-none cursor-pointer pr-8 text-sm font-light py-3 px-3 bg-secondary/50 hover:bg-secondary rounded-xl border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" aria-label={t("filters.budget")}>
                      <option value={0}>{t("filters.budget")}</option>
                      {BUDGET_OPTIONS.map((budget) => (<option key={budget.value} value={budget.value}>{budget.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  <div className="flex gap-1.5 min-w-0">
                    <VoiceSearchButton onResult={handleVoiceResult} />
                    <button onClick={handleSearch}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 rounded-xl text-primary-foreground font-medium bg-primary hover:brightness-110 active:scale-[0.97] transition-all shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]"
                      aria-label={t("hero.search")}>
                      <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      <span className="text-xs truncate">{t("hero.search")}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2 — Body type quick filters */}
              <div className="col-span-12 md:col-span-7 lg:col-span-3 p-5 rounded-2xl bg-white/95 dark:bg-card/90 backdrop-blur-xl border border-white/40 dark:border-border/40 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                  <span className="text-[11px] font-medium text-foreground/80 uppercase tracking-wider">
                    {t("hero.bodyType") || "Carrosserie"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {bodyTypes.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => handleBodyType(key)}
                      className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary text-foreground/80 transition-all active:scale-95 group"
                      aria-label={label}
                    >
                      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                      <span className="text-[10px] font-light truncate w-full text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 3 — Compare CTA */}
              <Link
                to="/compare"
                className="col-span-12 md:col-span-5 lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center gap-2">
                  <GitCompareArrows className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="text-[11px] font-medium uppercase tracking-wider opacity-90">
                    {t("hero.compareTitle") || "Comparer"}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-light leading-tight mb-2 opacity-95">
                    {t("hero.compareDesc") || "Jusqu'à 3 voitures côte à côte"}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    {t("hero.compareCta") || "Comparer"}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          )}
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
