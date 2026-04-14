import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const EarlyAccessBanner = () => {
  const [isVisible, setIsVisible] = useState(() => {
    return !sessionStorage.getItem('earlyAccessBannerDismissed');
  });
  const { language } = useLanguage();

  if (!isVisible) return null;

  const isNl = language === 'nl';

  return (
    <div className="relative bg-gradient-to-r from-primary/15 via-primary/5 to-accent/10 border-b border-primary/10">
      <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="text-foreground font-medium text-[11px] sm:text-sm truncate">
            <span className="hidden sm:inline">
              {isNl
                ? 'Verkoop uw auto met vertrouwen — gratis schatting in 2 minuten'
                : 'Vendez votre voiture en toute confiance — estimation gratuite en 2 min'}
            </span>
            <span className="sm:hidden">
              {isNl
                ? 'Verkoop met vertrouwen, gratis!'
                : 'Vendez en confiance, c\'est gratuit !'}
            </span>
          </span>
        </div>
        <button
          onClick={() => {
            sessionStorage.setItem('earlyAccessBannerDismissed', 'true');
            setIsVisible(false);
          }}
          className="text-muted-foreground hover:text-foreground shrink-0 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default EarlyAccessBanner;
