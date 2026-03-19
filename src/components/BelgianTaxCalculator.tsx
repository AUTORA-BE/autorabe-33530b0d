import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Euro, Leaf, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Region = "bruxelles" | "wallonie" | "flandre";

interface BelgianTaxCalculatorProps {
  powerKw?: number | null;
  fuelType?: string;
  euroNorm?: string;
  year?: number;
}

/**
 * Belgian TMC (Taxe de Mise en Circulation) + annual tax estimator
 * Based on Belgian fiscal rules per region
 */

// TMC brackets by fiscal CV (Wallonie & Bruxelles use similar progressive scales)
function computeFiscalCV(kw: number): number {
  // Belgian fiscal CV formula: roughly (kw * 0.00458) ^ 2 mapped to CV brackets
  // Simplified: 1 CV per ~7.35 kW for < 70kW, then diminishing
  if (kw <= 70) return Math.max(1, Math.round(kw / 7.35));
  return Math.round(kw / 6.5);
}

function computeTMC(fiscalCV: number, region: Region, age: number): number {
  // TMC decreases with vehicle age, fully exempt after 25 years in some regions
  let baseTMC = 0;

  // Progressive scale (simplified Belgian 2025 rates)
  if (fiscalCV <= 4) baseTMC = 61.50;
  else if (fiscalCV <= 6) baseTMC = 123.00;
  else if (fiscalCV <= 8) baseTMC = 495.00;
  else if (fiscalCV <= 10) baseTMC = 867.00;
  else if (fiscalCV <= 11) baseTMC = 1239.00;
  else if (fiscalCV <= 14) baseTMC = 2478.00;
  else if (fiscalCV <= 17) baseTMC = 4957.00;
  else baseTMC = 4957.00 + (fiscalCV - 17) * 500;

  // Age reduction
  if (region === "flandre") {
    // Flanders: fixed BIV based on CO2 (simplified as kW proxy)
    if (age >= 1) baseTMC *= Math.max(0, 1 - age * 0.05);
  } else {
    // Brussels & Wallonia: age reduction
    if (age >= 1 && age < 2) baseTMC *= 0.85;
    else if (age >= 2 && age < 3) baseTMC *= 0.70;
    else if (age >= 3 && age < 4) baseTMC *= 0.55;
    else if (age >= 4 && age < 5) baseTMC *= 0.40;
    else if (age >= 5) baseTMC *= 0.25;
  }

  return Math.round(baseTMC);
}

function computeAnnualTax(fiscalCV: number, region: Region, fuelType: string): number {
  // Annual tax (taxe de circulation) based on fiscal CV
  let base = 0;

  if (fuelType.toLowerCase().includes("lectrique") || fuelType.toLowerCase().includes("electric")) {
    // Electric vehicles: minimal or zero
    if (region === "flandre") return 0;
    return 85; // Flat minimum in Wallonia/Brussels
  }

  // Progressive scale (simplified 2025 rates)
  if (fiscalCV <= 4) base = 85;
  else if (fiscalCV <= 6) base = 149;
  else if (fiscalCV <= 8) base = 262;
  else if (fiscalCV <= 10) base = 421;
  else if (fiscalCV <= 11) base = 543;
  else if (fiscalCV <= 14) base = 867;
  else if (fiscalCV <= 17) base = 1239;
  else base = 1239 + (fiscalCV - 17) * 200;

  // Diesel surcharge in Brussels
  if (region === "bruxelles" && fuelType.toLowerCase().includes("diesel")) {
    base *= 1.15;
  }

  // LPG surcharge
  if (fuelType.toLowerCase().includes("gpl") || fuelType.toLowerCase().includes("lpg")) {
    base += fiscalCV * 10;
  }

  return Math.round(base);
}

export default function BelgianTaxCalculator({ powerKw, fuelType = "", euroNorm, year }: BelgianTaxCalculatorProps) {
  const [region, setRegion] = useState<Region>("bruxelles");
  const [manualKw, setManualKw] = useState<string>(powerKw?.toString() || "");

  const kw = parseInt(manualKw) || powerKw || 0;
  const vehicleAge = year ? new Date().getFullYear() - year : 0;

  const { fiscalCV, tmc, annualTax } = useMemo(() => {
    if (kw <= 0) return { fiscalCV: 0, tmc: 0, annualTax: 0 };
    const cv = computeFiscalCV(kw);
    return {
      fiscalCV: cv,
      tmc: computeTMC(cv, region, vehicleAge),
      annualTax: computeAnnualTax(cv, region, fuelType),
    };
  }, [kw, region, vehicleAge, fuelType]);

  const regionLabels: Record<Region, string> = {
    bruxelles: "Bruxelles-Capitale",
    wallonie: "Wallonie",
    flandre: "Flandre",
  };

  const isElectric = fuelType.toLowerCase().includes("lectrique") || fuelType.toLowerCase().includes("electric");

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Taxes belges estimées
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Estimation basée sur la puissance fiscale (CV fiscaux). Les montants réels peuvent varier selon le CO₂ exact et d'autres paramètres.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Puissance (kW)</label>
            <Input
              type="number"
              value={manualKw}
              onChange={(e) => setManualKw(e.target.value)}
              placeholder="Ex: 110"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Région</label>
            <Select value={region} onValueChange={(v: string) => setRegion(v as Region)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(regionLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {kw > 0 && (
          <>
            {/* Fiscal CV badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Puissance fiscale :</span>
              <Badge variant="secondary" className="text-xs">{fiscalCV} CV fiscaux</Badge>
              {isElectric && (
                <Badge className="bg-primary/10 text-primary border-0 text-xs">
                  <Leaf className="w-3 h-3 mr-1" />
                  Électrique
                </Badge>
              )}
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/50 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">TMC (une fois)</p>
                <p className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                  <Euro className="h-4 w-4 text-primary" />
                  {tmc.toLocaleString("fr-BE")}
                </p>
                {vehicleAge > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">Réduction {vehicleAge} an(s)</p>
                )}
              </div>
              <div className="rounded-xl bg-secondary/50 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Taxe annuelle</p>
                <p className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                  <Euro className="h-4 w-4 text-primary" />
                  {annualTax.toLocaleString("fr-BE")}/an
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              💡 Estimation indicative pour {regionLabels[region]}. Consultez le SPF Finances pour les montants exacts.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
