/** Step 3: Usage & KM */

import { Slider } from '@/components/ui/slider';
import { FACTEUR_REALITE } from '../../constants/belgianData';
import type { TcoFormData, UsageType } from '../../types/tco.types';

interface Props {
  formData: TcoFormData;
  updateField: <K extends keyof TcoFormData>(key: K, val: TcoFormData[K]) => void;
}

const usageOptions: { value: UsageType; icon: string; label: string }[] = [
  { value: 'ville', icon: '🏙️', label: 'Ville' },
  { value: 'mixte', icon: '🛣️', label: 'Mixte' },
  { value: 'route', icon: '🚗', label: 'Route' },
];

const UsageStep = ({ formData, updateField }: Props) => {
  const fuelCat = formData.fuelType.startsWith('essence') ? 'essence' : formData.fuelType === 'electric' ? 'electric' : 'diesel';
  const facteur = FACTEUR_REALITE[formData.usage][fuelCat] || 1.1;
  const surplus = Math.round((facteur - 1) * 100);

  const kmColor = formData.kmPerYear < 10000 ? 'text-green-500' : formData.kmPerYear < 25000 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Votre usage</h2>
      <p className="text-muted-foreground mb-8">Type de trajet et kilométrage annuel</p>

      <div className="space-y-10">
        {/* Usage type */}
        <div className="grid grid-cols-3 gap-3">
          {usageOptions.map(opt => {
            const sel = formData.usage === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateField('usage', opt.value)}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  sel
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border/50 bg-secondary/30 hover:border-green-500/50'
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-sm font-semibold text-foreground">{opt.label}</div>
              </button>
            );
          })}
        </div>

        <div className="text-center p-3 rounded-xl bg-secondary/50">
          <p className="text-sm text-muted-foreground">
            Consommation réelle <span className="font-semibold text-foreground">+{surplus}%</span> vs WLTP
          </p>
        </div>

        {/* KM per year */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-4">Km par an</label>
          <div className="text-center mb-4">
            <span className={`text-4xl font-bold tabular-nums ${kmColor}`}>
              {formData.kmPerYear.toLocaleString('fr-BE')}
            </span>
            <span className="text-lg text-muted-foreground ml-2">km/an</span>
          </div>
          <Slider
            value={[formData.kmPerYear]}
            onValueChange={([v]) => updateField('kmPerYear', v)}
            min={5000}
            max={50000}
            step={1000}
            className="[&_[role=slider]]:border-green-500 [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-green-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>5 000 km</span>
            <span>50 000 km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStep;
