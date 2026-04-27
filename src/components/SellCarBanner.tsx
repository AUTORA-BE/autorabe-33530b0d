import { ArrowRight, Sparkles, X, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const SellCarBanner = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("sellBannerDismissed");
    if (dismissed) {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    localStorage.setItem("sellBannerDismissed", "true");
    setTimeout(() => setIsVisible(false), 300);
  };

  if (isDismissed || !isVisible) return null;

  const isNl = language === "nl";

  return (
    <section
      className="relative overflow-hidden transition-[opacity,transform,max-height] duration-300 ease-out"
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "translateY(-20px)" : "translateY(0)",
        maxHeight: isExiting ? 0 : 200,
      }}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-accent/10" />

      <div className="relative container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
          {/* Left content */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {isNl ? "Verkoop uw auto snel" : "Vendez rapidement"}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                  <Sparkles className="w-2.5 h-2.5" />
                  {isNl ? "Gratis" : "Gratuit"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {isNl
                  ? "Car-Pass verificatie · LEZ check · 3 min"
                  : "Vérification Car-Pass · Check LEZ · 3 min"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              onClick={() => navigate("/sell")}
              size="sm"
              className="rounded-full group whitespace-nowrap font-semibold px-4 sm:px-5 text-xs sm:text-sm shadow-lg shadow-primary/15 hover:shadow-xl transition-all h-9 sm:h-10"
            >
              {isNl ? "Verkopen" : "Publier"}
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  );
};

export default SellCarBanner;
