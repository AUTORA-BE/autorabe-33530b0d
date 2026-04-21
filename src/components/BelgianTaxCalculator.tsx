import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Euro, Leaf, Info, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useTaxBrackets,
  computeFiscalCV,
  computeTmcFromDb,
  computeAnnualTaxFromDb,
  type Region,
} from "@/features/admin/hooks/useTaxBrackets";

interface BelgianTaxCalculatorProps {
  powerKw?: number | null;
  fuelType?: string;
  euroNorm?: string;
  year?: number;
}

/**
 * Belgian TMC + annual tax estimator.
 * Brackets are fetched from Supabase (admin-editable, no redeploy needed).
 */
export default function BelgianTaxCalculator({ powerKw, fuelType = "", euroNorm, year }: BelgianTaxCalculatorProps) {
  const [region, setRegion] = useState<Region>("bruxelles");
  const [manualKw, setManualKw] = useState<string>(powerKw?.toString() || "");

  const { data, isLoading } = useTaxBrackets();

  const kw = parseInt(manualKw) || powerKw || 0;
  const vehicleAge = year ? new Date().getFullYear() - year : 0;

  const { fiscalCV, tmc, annualTax } = useMemo(() => {
    if (kw <= 0 || !data) return { fiscalCV: 0, tmc: 0, annualTax: 0 };
    const cv = computeFiscalCV(kw);
    return {
      fiscalCV: cv,
      tmc: computeTmcFromDb(data.tmc, data.ages, region, cv, vehicleAge),
      annualTax: computeAnnualTaxFromDb(data.annual, region, cv, fuelType),
    };
  }, [kw, region, vehicleAge, fuelType, data]);

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
                {Object.entries(regionLabels).map(([k, v]: [string, string]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {kw > 0 && isLoading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des barèmes…
          </div>
        )}

        {kw > 0 && !isLoading && (
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
