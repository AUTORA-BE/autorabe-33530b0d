/** Elegant fuel price widget — Belgian market prices (glassmorphic, responsive). */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Flame, Zap, Clock } from 'lucide-react';
import { PRIX_CARBURANT } from '@/features/tco/constants/belgianData';

interface FuelPriceStripProps {
  compact?: boolean;
}

const FUELS = [
  { key: 'diesel', label: 'Diesel B7', price: PRIX_CARBURANT.diesel, unit: '€/L', icon: Droplets },
  { key: 'essence95', label: 'E10 (95)', price: PRIX_CARBURANT.essence95, unit: '€/L', icon: Flame },
  { key: 'essence98', label: 'E98', price: PRIX_CARBURANT.essence98, unit: '€/L', icon: Flame },
  { key: 'electric', label: 'Électricité', price: PRIX_CARBURANT.electric_domicile, unit: '€/kWh', icon: Zap },
];

const FuelPriceStrip = ({ compact = false }: FuelPriceStripProps) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  const items = compact ? FUELS.slice(0, 3) : FUELS;

  if (!loaded) {
    return (
      <div className={`flex items-center gap-3 ${compact ? 'justify-center' : 'justify-center flex-wrap'}`}>
        {items.map((f) => (
          <div
            key={f.key}
            className={`rounded-xl skeleton-shimmer ${compact ? 'h-6 w-20' : 'h-12 w-28'}`}
          />
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
              aria-label={`${fuel.label} : ${fuel.price.toFixed(2)} ${fuel.unit}`}
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
    <div className="w-full py-4 sm:py-6">
      <div className="container mx-auto px-4 sm:px-6">
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
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                aria-label={`${fuel.label} : ${fuel.price.toFixed(2)} ${fuel.unit}`}
                className="snap-center shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl
                  bg-card/40 backdrop-blur-xl border border-border/20
                  hover:border-primary/30 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground leading-none mb-0.5">{fuel.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-foreground font-semibold text-sm leading-none">
                      {fuel.price.toFixed(fuel.key === 'electric' ? 2 : 3)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">{fuel.unit}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Update badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="snap-center shrink-0 flex items-center gap-1 px-3 self-center"
          >
            <Clock className="w-2.5 h-2.5 text-muted-foreground/50" strokeWidth={1.5} />
            <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap">MAJ Mars 2026</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FuelPriceStrip;
