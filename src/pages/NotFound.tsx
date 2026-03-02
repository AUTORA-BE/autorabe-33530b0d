import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft, Search, Car, Calculator, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";

const suggestions = [
  { icon: Car, labelFr: "Parcourir les annonces", labelNl: "Bekijk de advertenties", to: "/" },
  { icon: Calculator, labelFr: "Calculer le TCO", labelNl: "TCO berekenen", to: "/calculateur-tco" },
  { icon: MessageCircle, labelFr: "Nous contacter", labelNl: "Contacteer ons", to: "/contact" },
];

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const texts = {
    title: language === "nl" ? "Pagina niet gevonden" : "Page introuvable",
    subtitle: language === "nl"
      ? "Sorry, de pagina die u zoekt bestaat niet of is verplaatst."
      : "Désolé, la page que vous recherchez n'existe pas ou a été déplacée.",
    back: language === "nl" ? "Terug" : "Retour",
    home: language === "nl" ? "Startpagina" : "Accueil",
    searchPlaceholder: language === "nl" ? "Zoek een voertuig..." : "Rechercher un véhicule...",
    suggestions: language === "nl" ? "Suggesties" : "Suggestions",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SEOHead
        title={`404 — ${texts.title}`}
        description={texts.subtitle}
        url={`https://autora.be${location.pathname}`}
      />
      <motion.div
        className="text-center px-6 max-w-lg w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated 404 badge */}
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 mb-8"
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
        >
          <span className="text-5xl font-bold text-primary font-display">404</span>
        </motion.div>

        <h1 className="mb-3 text-3xl md:text-4xl font-bold text-foreground font-display">
          {texts.title}
        </h1>
        <p className="mb-8 text-base text-muted-foreground">
          {texts.subtitle}
        </p>

        {/* Quick search bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
            }
          }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={texts.searchPlaceholder}
              className="search-input w-full pl-10 pr-4"
            />
          </div>
        </form>

        {/* Quick links */}
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          {texts.suggestions}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mb-8">
          {suggestions.map(({ icon: Icon, labelFr, labelNl, to }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              {language === "nl" ? labelNl : labelFr}
            </Link>
          ))}
        </div>

        {/* Main actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            {texts.back}
          </Button>
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              {texts.home}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
