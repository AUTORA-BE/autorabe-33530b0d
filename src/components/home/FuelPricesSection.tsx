/**
 * FuelPricesSection — Prix carburants Belgique (homepage).
 * Sombre, 4 cartes avec sparklines inline SVG, données depuis Supabase si dispo
 * sinon fallback statique src/data/fuelPrices.ts.
 * @module components/home/FuelPricesSection
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Flame, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FUEL_PRICES, type FuelPriceEntry } from '@/data/fuelPrices';
import { cn } from '@/lib/utils';

const ICONS: Record<FuelPriceEntry['key'], { Icon: typeof Droplets; tint: string }> = {
  diesel: { Icon: Droplets, tint: 'bg-red-500/10 text-red-400' },
  essence95: { Icon: Droplets, tint: 'bg-emerald-500/10 text-emerald-400' },
  essence98: { Icon: Flame, tint: 'bg-orange-500/10 text-orange-400' },
  electric: { Icon: Zap, tint: 'bg-primary/15 text-primary' },
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');
  const stroke = positive ? 'hsl(0 72% 60%)' : 'hsl(var(--primary))';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

const FuelPricesSection = () => {
  const [prices, setPrices] = useState<FuelPriceEntry[]>(FUEL_PRICES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('fuel_prices')
        .select('diesel, essence95, essence98, electric_home')
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      const d = data as { diesel: number; essence95: number; essence98: number; electric_home: number };
      setPrices((prev) =>
        prev.map((p) => {
          const next =
            p.key === 'diesel' ? d.diesel :
            p.key === 'essence95' ? d.essence95 :
            p.key === 'essence98' ? d.essence98 :
            d.electric_home;
          return next != null ? { ...p, price: next } : p;
        }),
      );
    })();
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <section className="bg-[#0a0a0a] text-white py-16 sm:py-24 border-y border-white/5">
      <div className="container mx-auto max-w-[1280px] px-6 sm:px-12">
        {/* Header */}
        <div className="mb-10 sm:mb-14 max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] uppercase tracking-[0.25em] text-primary font-medium mb-3"
          >
            Données temps réel
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="font-serif text-3xl sm:text-5xl font-light tracking-tight"
          >
            Prix carburants Belgique
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-base font-light mt-3 max-w-xl"
          >
            Moyennes nationales mises à jour quotidiennement — utilisées dans le calculateur TCO de chaque annonce.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {prices.map((fuel, i) => {
            const { Icon, tint } = ICONS[fuel.key];
            const positive = fuel.variation >= 0;
            const VarIcon = positive ? TrendingUp : TrendingDown;
            return (
              <motion.article
                key={fuel.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tint)}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full',
                      positive ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400',
                    )}
                  >
                    <VarIcon className="w-3 h-3" strokeWidth={2} />
                    {positive ? '+' : ''}{fuel.variation.toFixed(1)}%
                  </span>
                </div>

                <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium mb-2">
                  {fuel.label}
                </p>

                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="font-serif text-4xl font-light tabular-nums">
                    {fuel.price.toFixed(fuel.key === 'electric' ? 2 : 3)}
                  </span>
                  <span className="text-sm text-white/40">{fuel.unit}</span>
                </div>

                <div className="-mx-1">
                  <Sparkline data={fuel.series} positive={positive} />
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-white/40 font-light">
          Dernière mise à jour : {today} · Source : données officielles SPF Économie + opérateurs de bornes.
        </p>
      </div>
    </section>
  );
};

export default FuelPricesSection;
