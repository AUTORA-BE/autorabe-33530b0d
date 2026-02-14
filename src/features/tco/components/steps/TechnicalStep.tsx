/** Step 6: Technical details */

import { Slider } from '@/components/ui/slider';
import { DEFAULT_CONSUMPTION, EURO_NORMS } from '../../constants/belgianData';
import type { TcoFormData, EuroNorm } from '../../types/tco.types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface Props {
  formData: TcoFormData;
  updateField: <K extends keyof TcoFormData>(key: K, val: TcoFormData[K]) => void;
}

const TechnicalStep = ({ formData, updateField }: Props) => {
  const isElectric = formData.fuelType === 'electric';
  const consoUnit = isElectric ? 'kWh/100km' : 'L/100km';

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Détails techniques</h2>
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-8">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          ℹ️ Valeurs pré-remplies selon votre véhicule. Ajustez si nécessaire.
        </p>
      </div>

      <div className="space-y-8">
        {/* Fiscal power */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm font-medium text-foreground">Puissance fiscale</label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Indiquée sur votre carte grise (CV fiscaux)</TooltipContent>
            </Tooltip>
          </div>
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-foreground tabular-nums">{formData.fiscalPower}</span>
            <span className="text-sm text-muted-foreground ml-1">CV</span>
          </div>
          <Slider
            value={[formData.fiscalPower]}
            onValueChange={([v]) => updateField('fiscalPower', v)}
            min={4}
            max={20}
            step={1}
            className="[&_[role=slider]]:border-green-500 [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-green-500"
          />
        </div>

        {/* Consumption */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm font-medium text-foreground">Consommation WLTP</label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Consommation officielle WLTP du constructeur</TooltipContent>
            </Tooltip>
          </div>
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-foreground tabular-nums">{formData.consumption}</span>
            <span className="text-sm text-muted-foreground ml-1">{consoUnit}</span>
          </div>
          <Slider
            value={[formData.consumption * 10]}
            onValueChange={([v]) => updateField('consumption', v / 10)}
            min={isElectric ? 100 : 20}
            max={isElectric ? 300 : 200}
            step={1}
            className="[&_[role=slider]]:border-green-500 [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-green-500"
          />
        </div>

        {/* Euro norm */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-3">Norme Euro</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EURO_NORMS.map(opt => {
              const sel = formData.euroNorm === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateField('euroNorm', opt.value)}
                  className={`p-3 rounded-xl border text-sm text-center transition-all ${
                    sel
                      ? 'border-green-500 bg-green-500/10 font-semibold text-foreground'
                      : 'border-border/50 bg-secondary/30 text-muted-foreground hover:border-green-500/50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalStep;
