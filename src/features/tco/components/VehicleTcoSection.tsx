/**
 * Inline TCO calculator for vehicle detail pages
 * Pre-fills data from the vehicle listing and lets the user tweak inputs
 * @module features/tco/components
 */

import { useState, useMemo, useCallback } from "react";
import { Calculator, ChevronDown, ChevronUp, Fuel, Wrench, Shield, FileText, TrendingDown, Info, ArrowLeftRight, Zap, Car } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PRIX_CARBURANT, FACTEUR_REALITE, ENTRETIEN_BASE,
  ASSURANCE_RC, COEFF_BONUS, MULT_COUVERTURE,
  TAXE_REGION, DEPRECIATION,
} from "../constants/belgianData";
import type { FuelType as TcoFuelType, Region } from "../types/tco.types";

/* ─── helpers ─── */

/** Map listing fuel string → TCO FuelType */
function mapFuelType(fuelType: string): TcoFuelType {
  const lower = fuelType.toLowerCase();
  if (lower.includes("diesel")) return "diesel";
  if (lower.includes("électrique") || lower.includes("electric")) return "electric";
  if (lower.includes("hybride rechargeable") || lower.includes("phev")) return "hybridePHEV";
  if (lower.includes("hybride") || lower.includes("hybrid")) return "hybride";
  return "essence95";
}

/** Default consumption L/100km (or kWh for electric) */
function defaultConsumption(fuel: TcoFuelType): number {
  const map: Record<TcoFuelType, number> = {
    diesel: 6.0, essence95: 7.5, essence98: 7.5,
    electric: 18, hybridePHEV: 2.5, hybride: 5.5,
  };
  return map[fuel] ?? 7.5;
}

/** Maintenance cost by vehicle age */
function maintenanceCost(age: number): number {
  if (age < 3) return 300;
  if (age <= 7) return 600;
  if (age <= 12) return 900;
  return 1200;
}

/** Format EUR */
function eur(n: number): string {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

/* ─── types ─── */

interface VehicleTcoProps {
  price: number;
  fuelType: string;
  year: number;
  mileage: number;
  power?: number | null;
}

interface TcoInputs {
  kmPerYear: number;
  region: Region;
  insuranceAnnual: number;
}

interface TcoResult {
  prixAchat: number;
  carburant: number;
  entretien: number;
  assurance: number;
  taxe: number;
  depreciation: number;
  total: number;
  mensuel: number;
  carburantAnnuel: number;
}

/* ─── calculation ─── */

function computeTco(
  price: number,
  fuel: TcoFuelType,
  year: number,
  inputs: TcoInputs,
): TcoResult {
  const age = 2026 - year;
  const totalKm = inputs.kmPerYear * 5;

  // Fuel cost
  let carburant: number;
  const fuelCat = fuel === "electric" ? "electric" : fuel.startsWith("essence") ? "essence" : "diesel";
  const facteur = FACTEUR_REALITE.mixte[fuelCat] ?? 1.1;
  const conso = defaultConsumption(fuel) * facteur;

  if (fuel === "electric") {
    const coutKwh = 0.30; // charge domicile
    carburant = (totalKm / 100) * conso * coutKwh;
  } else {
    const prixL = fuel === "hybridePHEV" ? PRIX_CARBURANT.essence95 : (PRIX_CARBURANT[fuel] ?? 1.75);
    carburant = (totalKm / 100) * conso * prixL;
  }

  // Maintenance
  const entretienAn = maintenanceCost(age);
  const entretien = entretienAn * 5;

  // Insurance
  const assurance = inputs.insuranceAnnual * 5;

  // Tax
  const taxeAn = TAXE_REGION[inputs.region]?.[fuel] ?? 200;
  const taxe = taxeAn * 5;

  // Depreciation
  const deprec = price * (DEPRECIATION[fuel] ?? 0.45);

  const total = price + carburant + entretien + assurance + taxe + deprec;

  return {
    prixAchat: price,
    carburant: Math.round(carburant),
    entretien: Math.round(entretien),
    assurance: Math.round(assurance),
    taxe: Math.round(taxe),
    depreciation: Math.round(deprec),
    total: Math.round(total),
    mensuel: Math.round(total / 60),
    carburantAnnuel: Math.round(carburant / 5),
  };
}

/* ─── component ─── */

export default function VehicleTcoSection({ price, fuelType, year, mileage, power }: VehicleTcoProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const fuel = useMemo(() => mapFuelType(fuelType), [fuelType]);

  const [inputs, setInputs] = useState<TcoInputs>({
    kmPerYear: 15000,
    region: "bruxelles",
    insuranceAnnual: 800,
  });

  const updateInput = useCallback(<K extends keyof TcoInputs>(key: K, val: TcoInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  }, []);

  const result = useMemo(() => computeTco(price, fuel, year, inputs), [price, fuel, year, inputs]);

  // All fuel options for comparison (exclude current)
  const FUEL_OPTIONS: { value: TcoFuelType; label: string }[] = [
    { value: "essence95", label: "Essence" },
    { value: "diesel", label: "Diesel" },
    { value: "electric", label: "Électrique" },
    { value: "hybride", label: "Hybride" },
    { value: "hybridePHEV", label: "Hybride PHEV" },
  ];
  const availableAlts = useMemo(() => FUEL_OPTIONS.filter(o => o.value !== fuel), [fuel]);
  const defaultAlt = fuel === "electric" ? "essence95" : "electric";
  const [selectedAltFuel, setSelectedAltFuel] = useState<TcoFuelType>(defaultAlt);
  // Reset if fuel changes
  const altFuel = availableAlts.find(o => o.value === selectedAltFuel) ? selectedAltFuel : availableAlts[0].value;
  const altLabel = FUEL_OPTIONS.find(o => o.value === altFuel)?.label ?? "Alternative";

  // Estimate alternative purchase price by fuel type
  const ALT_PRICE_FACTOR: Record<TcoFuelType, number> = {
    electric: 1.3, essence95: 0.75, essence98: 0.75, diesel: 0.8, hybride: 1.1, hybridePHEV: 1.2,
  };
  const altPrice = useMemo(() => {
    // Normalize current price to "base" then apply alt factor
    const currentFactor = ALT_PRICE_FACTOR[fuel] ?? 1;
    const basePrice = price / currentFactor;
    return Math.round(basePrice * (ALT_PRICE_FACTOR[altFuel] ?? 1));
  }, [price, fuel, altFuel]);
  const altResult = useMemo(() => computeTco(altPrice, altFuel, year, inputs), [altPrice, altFuel, year, inputs]);
  const savings = result.total - altResult.total;
  const DONUT_COLORS = ["#3b82f6", "#f59e0b", "#f97316", "#10b981", "#8b5cf6", "#ef4444"];

  const breakdownItems = [
    { label: "Prix d'achat", value: result.prixAchat, icon: FileText, color: "text-blue-500", fill: DONUT_COLORS[0] },
    { label: "Carburant (5 ans)", value: result.carburant, icon: Fuel, color: "text-amber-500", fill: DONUT_COLORS[1] },
    { label: "Entretien (5 ans)", value: result.entretien, icon: Wrench, color: "text-orange-500", fill: DONUT_COLORS[2] },
    { label: "Assurance (5 ans)", value: result.assurance, icon: Shield, color: "text-emerald-500", fill: DONUT_COLORS[3] },
    { label: "Taxe circulation (5 ans)", value: result.taxe, icon: FileText, color: "text-purple-500", fill: DONUT_COLORS[4] },
    { label: "Dépréciation estimée", value: result.depreciation, icon: TrendingDown, color: "text-red-500", fill: DONUT_COLORS[5] },
  ];

  const donutData = breakdownItems.map(item => ({ name: item.label, value: item.value, fill: item.fill }));

  const fuelLabel = {
    diesel: "Diesel", essence95: "Essence", essence98: "Essence 98",
    electric: "Électrique", hybridePHEV: "Hybride PHEV", hybride: "Hybride",
  }[fuel] ?? fuelType;

  return (
    <section className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-muted/20 shadow-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 sm:p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              💰 Coût total sur 5 ans
            </h2>
            <p className="text-sm text-muted-foreground">
              Calculez le véritable coût de cette voiture (achat + utilisation)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick summary when collapsed */}
          {!isOpen && (
            <span className="hidden sm:inline text-lg font-bold text-foreground">
              {eur(result.total)}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="px-4 sm:px-6 pb-6 space-y-6">
          {/* Pre-filled info */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {fuelLabel}
            </span>
            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
              {year}
            </span>
            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
              {new Intl.NumberFormat("fr-BE").format(mileage)} km
            </span>
            {power && (
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
                {power} ch
              </span>
            )}
          </div>

          {/* User inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* km/year */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Km/an : {new Intl.NumberFormat("fr-BE").format(inputs.kmPerYear)}
              </label>
              <Slider
                value={[inputs.kmPerYear]}
                onValueChange={([v]) => updateInput("kmPerYear", v)}
                min={5000}
                max={50000}
                step={1000}
              />
            </div>

            {/* Region */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Région</label>
              <Select value={inputs.region} onValueChange={(v) => updateInput("region", v as Region)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bruxelles">Bruxelles</SelectItem>
                  <SelectItem value="flandre">Flandre</SelectItem>
                  <SelectItem value="wallonie">Wallonie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Insurance */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Assurance/an : {eur(inputs.insuranceAnnual)}
              </label>
              <Slider
                value={[inputs.insuranceAnnual]}
                onValueChange={([v]) => updateInput("insuranceAnnual", v)}
                min={300}
                max={2500}
                step={50}
              />
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total card */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center space-y-1">
              <p className="text-sm text-muted-foreground">Coût total sur 5 ans</p>
              <p className="text-3xl font-display font-bold text-foreground">{eur(result.total)}</p>
              <p className="text-sm text-primary font-medium">
                soit {eur(result.mensuel)}/mois
              </p>
            </div>

            {/* Donut chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => eur(value)}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {breakdownItems.map((item) => {
                const pct = (item.value / result.total) * 100;
                return (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="flex-1 text-muted-foreground truncate">{item.label}</span>
                    <span className="font-medium text-foreground tabular-nums">{eur(item.value)}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
                Comparer avec :
              </div>
              <Select value={altFuel} onValueChange={(v) => setSelectedAltFuel(v as TcoFuelType)}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAlts.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Current vehicle */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary">
                  <Fuel className="w-3.5 h-3.5" />
                  {fuelLabel} (actuel)
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">{eur(result.total)}</p>
                <p className="text-xs text-muted-foreground">{eur(result.mensuel)}/mois</p>
              </div>

              {/* Alternative */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                  {altFuel === "electric" ? <Zap className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                  {altLabel} (estimé)
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">{eur(altResult.total)}</p>
                <p className="text-xs text-muted-foreground">{eur(altResult.mensuel)}/mois</p>
              </div>
            </div>

            {/* Savings banner */}
            <div className={cn(
              "rounded-md px-3 py-2 text-center text-sm font-medium",
              savings > 0
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : savings < 0
                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
            )}>
              {savings > 0
                ? `💡 Vous économiseriez ${eur(savings)} sur 5 ans en passant au ${altLabel.toLowerCase()}`
                : savings < 0
                  ? `Ce véhicule est déjà ${eur(Math.abs(savings))} moins cher sur 5 ans qu'un équivalent ${altLabel.toLowerCase()}`
                  : "Coût équivalent sur 5 ans"}
            </div>

            <p className="text-xs text-muted-foreground">
              * Prix d'achat {altLabel.toLowerCase()} estimé à {eur(altPrice)}. Comparaison indicative.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>
              Estimation indicative basée sur les données moyennes du marché belge 2026.
              Le coût réel peut varier selon votre profil, la couverture d'assurance et l'entretien effectif.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
