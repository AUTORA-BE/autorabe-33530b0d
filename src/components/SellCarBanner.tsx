import { ArrowRight, Car, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const SellCarBanner = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (isDismissed || !isVisible) return null;

  return (
    <section
      className="relative overflow-hidden transition-[opacity,transform,max-height] duration-300 ease-out"
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(-20px)' : 'translateY(0)',
        maxHeight: isExiting ? 0 : 200,
      }}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
      
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" 
           style={{ 
             backgroundSize: '200% 100%',
             animation: 'shimmer 3s ease-in-out infinite'
           }} 
      />
      
      <div className="relative container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-2.5 sm:py-5">
          {/* Left content */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Car className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
            </div>
            
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm sm:text-lg font-bold text-foreground truncate">
                {t("sellBanner.title")}
              </h3>
              <p className="text-xs text-muted-foreground hidden sm:block max-w-md">
                {t("sellBanner.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={() => navigate("/sell")}
              size="sm"
              className="btn-primary-gradient group whitespace-nowrap font-semibold px-4 sm:px-6 text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all h-8 sm:h-10"
            >
              {t("sellBanner.cta")}
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-full h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
};

export default SellCarBanner;
