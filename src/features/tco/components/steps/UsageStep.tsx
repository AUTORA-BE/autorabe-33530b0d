/** Step 3: Usage & KM */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { FACTEUR_REALITE } from '../../constants/belgianData';
import type { TcoFormData, UsageType } from '../../types/tco.types';

interface Props {
  formData: TcoFormData;
  updateField: <K extends keyof TcoFormData>(key: K, val: TcoFormData[K]) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const usageOptions: { value: UsageType; icon: string; label: string }[] = [
  { value: 'ville', icon: '🏙️', label: 'Ville' },
  { value: 'mixte', icon: '🛣️', label: 'Mixte' },
  { value: 'route', icon: '🚗', label: 'Route' },
];

const UsageStep = ({ formData, updateField }: Props) => {
  const fuelCat = formData.fuelType.startsWith('essence') ? 'essence' : formData.fuelType === 'electric' ? 'electric' : 'diesel';
  const facteur = FACTEUR_REALITE[formData.usage][fuelCat] || 1.1;
  const surplus = Math.round((facteur - 1) * 100);

  const kmColor = formData.kmPerYear < 10000 ? 'text-primary' : formData.kmPerYear < 25000 ? 'text-yellow-500' : 'text-red-500';

  const [kmInput, setKmInput] = useState(String(formData.kmPerYear));

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
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-secondary/30 hover:border-primary/50'
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Input
              type="number"
              value={kmInput}
              onChange={e => setKmInput(e.target.value)}
              onBlur={() => {
                const v = clamp(Math.round(Number(kmInput) || 15000), 5000, 50000);
                updateField('kmPerYear', v);
                setKmInput(String(v));
              }}
              min={5000}
              max={50000}
              className={`w-32 text-center text-2xl font-bold tabular-nums h-12 ${kmColor}`}
            />
            <span className="text-lg text-muted-foreground">km/an</span>
          </div>
          <Slider
            value={[formData.kmPerYear]}
            onValueChange={([v]) => { updateField('kmPerYear', v); setKmInput(String(v)); }}
            min={5000}
            max={50000}
            step={500}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-primary"
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
