import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Leaf, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TaxResultDisplay from "@/components/tax/TaxResultDisplay";
import {
  calculerTMC,
  calculerTaxeCirculation,
  type Region,
  type VehiculeFiscal,
} from "@/lib/belgianTax";
import { REGION_LABELS, ageDepuisAnnee, chToKw, mapCarburant, normaliserCycle } from "@/lib/belgianTaxHelpers";

interface BelgianTaxCalculatorProps {
  /** Puissance en chevaux (ch), telle que stockée sur l'annonce */
  powerKw?: number | null;
  fuelType?: string;
  euroNorm?: string;
  year?: number;
  co2?: number | null;
  co2Cycle?: string | null;
  mma?: number | null;
  puissanceCv?: number | null;
}

/**
 * Estimateur TMC / BIV + taxe de circulation, branché sur le moteur
 * `src/lib/belgianTax.ts` (barèmes officiels 01/07/2026 – 30/06/2027).
 */
export default function BelgianTaxCalculator({
  powerKw,
  fuelType = "",
  euroNorm,
  year,
  co2,
  co2Cycle,
  mma,
  puissanceCv,
}: BelgianTaxCalculatorProps) {
  const [region, setRegion] = useState<Region>("bruxelles");
  const [manualKw, setManualKw] = useState<string>(() => (chToKw(powerKw)?.toString() ?? ""));
  const [manualCv, setManualCv] = useState<string>(puissanceCv?.toString() ?? "");
  const [manualCo2, setManualCo2] = useState<string>(co2?.toString() ?? "");
  const [manualMma, setManualMma] = useState<string>(mma?.toString() ?? "");

  const vehicule: VehiculeFiscal = useMemo(() => ({
    region,
    puissanceKw: manualKw ? Number(manualKw) : null,
    puissanceCv: manualCv ? Number(manualCv) : null,
    co2: manualCo2 ? Number(manualCo2) : null,
    cycleCO2: normaliserCycle(co2Cycle),
    mma: manualMma ? Number(manualMma) : null,
    carburant: mapCarburant(fuelType),
    euroNorm: euroNorm ?? null,
    ageAnnees: ageDepuisAnnee(year),
  }), [region, manualKw, manualCv, manualCo2, manualMma, co2Cycle, fuelType, euroNorm, year]);

  const tmc = useMemo(() => calculerTMC(vehicule), [vehicule]);
  const circulation = useMemo(() => calculerTaxeCirculation(vehicule), [vehicule]);

  const isElectric = vehicule.carburant === "electrique" || vehicule.carburant === "hydrogene";

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
                <p className="text-xs">
                  Calcul fondé sur les barèmes régionaux officiels en vigueur. Aucun montant n'est affiché
                  lorsqu'une donnée légale indispensable manque.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Région</Label>
            <Select value={region} onValueChange={(v: string) => setRegion(v as Region)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REGION_LABELS) as Region[]).map((k) => (
                  <SelectItem key={k} value={k}>{REGION_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Puissance (kW)</Label>
            <Input type="number" inputMode="numeric" value={manualKw} onChange={(e) => setManualKw(e.target.value)} placeholder="Ex: 110" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Puissance fiscale (CV)</Label>
            <Input type="number" inputMode="numeric" value={manualCv} onChange={(e) => setManualCv(e.target.value)} placeholder="Ex: 11" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">CO₂ (g/km)</Label>
            <Input type="number" inputMode="numeric" value={manualCo2} onChange={(e) => setManualCo2(e.target.value)} placeholder="Ex: 120" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs font-medium text-muted-foreground">Masse maximale autorisée (kg)</Label>
            <Input type="number" inputMode="numeric" value={manualMma} onChange={(e) => setManualMma(e.target.value)} placeholder="Ex: 1900" className="h-9 text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">{REGION_LABELS[region]}</Badge>
          {euroNorm && <Badge variant="secondary" className="text-xs">{euroNorm}</Badge>}
          {isElectric && (
            <Badge className="bg-primary/10 text-primary border-0 text-xs">
              <Leaf className="w-3 h-3 mr-1" />
              Électrique
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TaxResultDisplay
            titre={region === "flandre" ? "BIV (une fois)" : "TMC (une fois)"}
            region={region}
            resultat={tmc}
          />
          <TaxResultDisplay
            titre="Taxe de circulation"
            suffixe=" /an"
            region={region}
            resultat={circulation}
          />
        </div>
      </CardContent>
    </Card>
  );
}
