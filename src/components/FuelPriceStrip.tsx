/** Elegant fuel price widget — Belgian market prices from database, luxe minimal. */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Flame, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PRIX_CARBURANT } from '@/features/tco/constants/belgianData';

interface FuelPriceStripProps {
  compact?: boolean;
}

interface FuelItem {
  key: string;
  label: string;
  price: number;
  unit: string;
  icon: typeof Droplets;
}

const FuelPriceStrip = ({ compact = false }: FuelPriceStripProps) => {
  const [fuels, setFuels] = useState<FuelItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Try loading from DB first
      const { data } = await supabase
        .from('fuel_prices')
        .select('diesel, essence95, essence98, electric_home, electric_public')
        .limit(1)
        .single();

      const d = data as { diesel: number; essence95: number; essence98: number; electric_home: number; electric_public: number } | null;

      const items: FuelItem[] = [
        { key: 'diesel', label: 'Diesel B7', price: d?.diesel ?? PRIX_CARBURANT.diesel, unit: '€/L', icon: Droplets },
        { key: 'essence95', label: 'E10 (95)', price: d?.essence95 ?? PRIX_CARBURANT.essence95, unit: '€/L', icon: Flame },
        { key: 'essence98', label: 'E98', price: d?.essence98 ?? PRIX_CARBURANT.essence98, unit: '€/L', icon: Flame },
        { key: 'electric', label: 'Électricité', price: d?.electric_home ?? PRIX_CARBURANT.electric_domicile, unit: '€/kWh', icon: Zap },
      ];

      setFuels(items);
      setLoaded(true);
    };
    load();
  }, []);

  const items = compact ? fuels.slice(0, 3) : fuels;

  if (!loaded) {
    return (
      <div className="flex items-center gap-3 justify-center flex-wrap">
        {[1, 2, 3, ...(compact ? [] : [4])].map((i) => (
          <div key={i} className="rounded-xl skeleton-shimmer h-10 w-24" />
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center justify-center gap-4 flex-wrap"
      >
        {items.map((fuel, i) => {
          const Icon = fuel.icon;
          return (
            <motion.span
              key={fuel.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="inline-flex items-center gap-1.5 text-muted-foreground"
            >
              <Icon className="w-3 h-3 text-primary/70" strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground/80">{fuel.price.toFixed(2)}</span>
              <span className="text-[10px] text-muted-foreground/70">{fuel.unit}</span>
            </motion.span>
          );
        })}
      </motion.div>
    );
  }

  return (
    <div className="py-6 sm:py-8">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent mb-6 sm:mb-8" />

        <div
          role="list"
          className="flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide sm:overflow-visible sm:flex-wrap sm:justify-center pb-1"
        >
          {items.map((fuel, i) => {
            const Icon = fuel.icon;
            return (
              <motion.div
                key={fuel.key}
                role="listitem"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="snap-center shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl
                  bg-card/30 backdrop-blur-sm border border-border/15
                  hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary/70" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground leading-none mb-0.5 font-light">{fuel.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-foreground font-medium text-sm leading-none">
                      {fuel.price.toFixed(fuel.key === 'electric' ? 2 : 3)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">{fuel.unit}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent mt-6 sm:mt-8" />
      </div>
    </div>
  );
};

export default FuelPriceStrip;
