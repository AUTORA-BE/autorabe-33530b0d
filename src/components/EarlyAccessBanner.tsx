/**
 * Early Access launch banner
 * Shows remaining spots for the free launch offer
 */

import { useState, useEffect } from 'react';
import { Rocket, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EARLY_ACCESS_TOTAL_SPOTS } from '@/config/betaConfig';

const EarlyAccessBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('earlyAccessBannerDismissed');
    if (dismissed) {
      setIsVisible(false);
      return;
    }

    // Count professional sellers to estimate spots taken
    const fetchCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('garage_name', 'is', null);

      const taken = count ?? 0;
      setRemainingSpots(Math.max(0, EARLY_ACCESS_TOTAL_SPOTS - taken));
    };
    fetchCount();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/15 via-primary/5 to-accent/10 border-b border-primary/10">
      <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="text-foreground font-medium text-[11px] sm:text-sm truncate">
            <span className="hidden sm:inline">Offre de lancement : Publication gratuite pour les 100 premiers garages.</span>
            <span className="sm:hidden">Lancement : Publication gratuite !</span>
          </span>
          {remainingSpots !== null && (
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold shrink-0">
              {remainingSpots} places
            </span>
          )}
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
