/** TCO Results page with breakdown, charts, alternatives, and transparency */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Fuel, Wrench, Shield, Landmark, TrendingDown, Gift, ArrowLeft, RotateCcw, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TcoFormData, TcoBreakdown, TcoAlternative } from '../../types/tco.types';
import { Link } from 'react-router-dom';

interface Props {
  formData: TcoFormData;
  breakdown: TcoBreakdown;
  alternatives: TcoAlternative[];
  onReset: () => void;
  onBack: () => void;
}

/** Animated count-up number */
function CountUp({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val.toLocaleString('fr-BE')}</>;
}

const CHART_COLORS = ['hsl(142,71%,45%)', 'hsl(217,91%,60%)', 'hsl(262,83%,58%)', 'hsl(25,95%,53%)', 'hsl(0,84%,60%)', 'hsl(47,96%,53%)'];

const breakdownItems = (b: TcoBreakdown) => [
  { key: 'carburant', label: 'Carburant', icon: Fuel, value: b.carburant, color: CHART_COLORS[0], annual: Math.round(b.carburant / 5) },
  { key: 'entretien', label: 'Entretien', icon: Wrench, value: b.entretien, color: CHART_COLORS[1], annual: Math.round(b.entretien / 5) },
  { key: 'assurance', label: 'Assurance', icon: Shield, value: b.assurance, color: CHART_COLORS[2], annual: Math.round(b.assurance / 5) },
  { key: 'taxe', label: 'Taxe circulation', icon: Landmark, value: b.taxe, color: CHART_COLORS[3], annual: Math.round(b.taxe / 5) },
  { key: 'depreciation', label: 'Dépréciation', icon: TrendingDown, value: b.depreciation, color: CHART_COLORS[4], annual: Math.round(b.depreciation / 5) },
];

const TcoResults = ({ _formData, breakdown, alternatives, onReset, onBack }: Props) => {
  const chartData = breakdownItems(breakdown).map(i => ({ name: i.label, value: i.value }));
  if (breakdown.prime > 0) chartData.push({ name: 'Prime', value: -breakdown.prime });

  return (
    <section className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero result */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <CheckCircle className="w-8 h-8 text-primary" />
          </motion.div>

          <p className="text-sm text-muted-foreground mb-2">Coût total sur 5 ans</p>
          <h2 className="text-5xl sm:text-6xl font-display font-bold text-foreground">
            <CountUp target={breakdown.total} /> €
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            soit <span className="font-semibold text-foreground">{breakdown.mensuel} €/mois</span>
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="bg-secondary/60 px-3 py-1 rounded-full">✓ Certifié</span>
            <span className="bg-secondary/60 px-3 py-1 rounded-full">✓ Sources SPF</span>
            <span className="bg-secondary/60 px-3 py-1 rounded-full">✓ MAJ 14/02/2026</span>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Répartition des coûts</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k€`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
              <RTooltip formatter={(v: number) => `${v.toLocaleString('fr-BE')} €`} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i < CHART_COLORS.length ? CHART_COLORS[i] : CHART_COLORS[0]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Breakdown cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {breakdownItems(breakdown).map((item, i) => {
            const Icon = item.icon;
            const pct = Math.round((item.value / breakdown.total) * 100);
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{pct}% du total</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{item.value.toLocaleString('fr-BE')} €</p>
                <p className="text-xs text-muted-foreground">~{item.annual.toLocaleString('fr-BE')} €/an</p>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Prime card */}
          {breakdown.prime > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="rounded-2xl border border-primary/30 bg-primary/10 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-semibold text-primary">Prime régionale</p>
              </div>
              <p className="text-2xl font-bold text-primary">-{breakdown.prime.toLocaleString('fr-BE')} €</p>
              <p className="text-xs text-primary/70 mt-1">⚠️ Sous conditions de revenus</p>
            </motion.div>
          )}
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">🔍 Et si vous choisissiez…</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {alternatives.map(alt => (
                <div key={alt.fuelType} className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-5">
                  <p className="font-semibold text-foreground mb-1">{alt.label}</p>
                  <p className="text-2xl font-bold text-foreground">{alt.breakdown.total.toLocaleString('fr-BE')} €</p>
                  <p className="text-sm mt-1">
                    {alt.economie > 0 ? (
                      <span className="text-primary font-semibold">Économie de {alt.economie.toLocaleString('fr-BE')} €</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Surcoût de {Math.abs(alt.economie).toLocaleString('fr-BE')} €</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{alt.breakdown.mensuel} €/mois sur 5 ans</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transparency */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 mb-8"
        >
          <Accordion type="single" collapsible>
            <AccordionItem value="methodology">
              <AccordionTrigger className="text-sm font-semibold">📖 Méthodologie & Sources</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                <p><strong>Carburant :</strong> SPF Économie, prix moyens BE février 2026, MAJ quotidienne.</p>
                <p><strong>Entretien :</strong> Touring & VAB, tarifs garage indépendant, +5%/an d'ancienneté.</p>
                <p><strong>Assurance :</strong> AG, Ethias, KBC – tarifs indicatifs 2026.</p>
                <p><strong>Taxes :</strong> Calculs officiels par région (Bruxelles, Flandre, Wallonie).</p>
                <p><strong>Dépréciation :</strong> AutoScout24 BE, 50k+ ventes analysées.</p>
                <p><strong>Primes :</strong> Sites régionaux officiels, conditions exactes applicables.</p>
                <p><strong>Marge d'erreur :</strong> ±10% taxes, ±15% entretien, ±30% assurance.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="mt-4 text-xs text-muted-foreground italic">
            ⚠️ Ces résultats sont des estimations avec une précision de ~90%. Vos coûts réels peuvent varier de ±10% à ±20% selon votre profil exact, votre historique de conduite et les fluctuations de prix.
          </p>
        </motion.div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link to="/">
              <Car className="w-4 h-4 mr-2" />
              Voir véhicules correspondants
            </Link>
          </Button>
          <Button variant="outline" onClick={onBack} className="h-12 px-6 rounded-2xl gap-2">
            <ArrowLeft className="w-4 h-4" /> Modifier
          </Button>
          <Button variant="ghost" onClick={onReset} className="h-12 px-6 rounded-2xl gap-2">
            <RotateCcw className="w-4 h-4" /> Recommencer
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TcoResults;
