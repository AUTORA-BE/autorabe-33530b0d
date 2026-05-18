/**
 * FuelPricesSection — Prix carburants Belgique (fond clair, sparklines SVG inline).
 * @module components/home/FuelPricesSection
 */

import { useEffect, useState } from 'react';
import { Droplet, Flame, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FUEL_PRICES, type FuelPrice } from '@/data/fuelPrices';

const ICONS = { droplet: Droplet, flame: Flame, zap: Zap } as const;

function buildSparklinePath(values: number[]): string {
  if (values.length === 0) return '';
  const width = 100;
  const height = 40;
  const padding = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + (height - padding * 2) * (1 - (v - min) / range);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function FuelCard({ fuel }: { fuel: FuelPrice }) {
  const Icon = ICONS[fuel.iconName];
  const isDown = fuel.trend === 'down';
  const path = buildSparklinePath(fuel.sparkline);
  const stroke = isDown ? 'hsl(var(--primary))' : 'rgb(239 68 68)';
  const badgeClass = isDown
    ? 'bg-primary/10 text-primary'
    : 'bg-red-500/10 text-red-600';

  return (
    <article className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${fuel.iconColor}`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeClass}`}>
          {isDown ? '▼' : '▲'}{fuel.variation.toFixed(1)}%
        </span>
      </div>

      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-6">
        {fuel.label}
      </p>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-4xl font-semibold text-foreground tabular-nums">
          {fuel.price.toFixed(fuel.decimals)}
        </span>
        <span className="text-sm text-muted-foreground">{fuel.unit}</span>
      </div>

      <svg viewBox="0 0 100 40" className="mt-6 w-full h-12" aria-hidden="true">
        <path d={path} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </article>
  );
}

const FuelPricesSection = () => {
  const [prices, setPrices] = useState<FuelPrice[]>(FUEL_PRICES);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('fuel_prices')
        .select('diesel, essence95, essence98, electric_home')
        .limit(1)
        .maybeSingle();
      if (!mounted || !data) return;
      setPrices((prev) =>
        prev.map((p) => {
          const next =
            p.id === 'diesel-b7' ? data.diesel :
            p.id === 'essence-e10' ? data.essence95 :
            p.id === 'essence-e98' ? data.essence98 :
            p.id === 'electricite' ? data.electric_home : null;
          return next != null ? { ...p, price: Number(next) } : p;
        }),
      );
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="space-y-4 max-w-2xl mb-12">
          <p className="text-xs md:text-sm font-medium uppercase tracking-[0.15em] text-primary">
            Données temps réel
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal leading-tight text-foreground">
            Prix carburants Belgique
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
            Moyennes nationales mises à jour quotidiennement — utilisées dans le calculateur TCO de chaque annonce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {prices.map((f) => <FuelCard key={f.id} fuel={f} />)}
        </div>

        <p className="mt-12 text-xs text-muted-foreground text-center">
          {formattedDate && <>Dernière mise à jour : {formattedDate} · </>}
          Source : données officielles SPF Économie + opérateurs de bornes.
        </p>
      </div>
    </section>
  );
};

export default FuelPricesSection;
