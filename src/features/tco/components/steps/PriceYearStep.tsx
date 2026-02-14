/** Step 2: Price & Year */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ENTRETIEN_BASE } from '../../constants/belgianData';
import type { TcoFormData } from '../../types/tco.types';

interface Props {
  formData: TcoFormData;
  updateField: <K extends keyof TcoFormData>(key: K, val: TcoFormData[K]) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const PriceYearStep = ({ formData, updateField }: Props) => {
  const age = 2026 - formData.year;
  const entretienEstime = Math.round(ENTRETIEN_BASE[formData.fuelType] * (1 + age * 0.05));

  const [priceInput, setPriceInput] = useState(String(formData.price));
  const [yearInput, setYearInput] = useState(String(formData.year));

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Prix & Année</h2>
      <p className="text-muted-foreground mb-8">Valeur d'achat et année du véhicule</p>

      <div className="space-y-10">
        {/* Price */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-4">Prix d'achat</label>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Input
              type="number"
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              onBlur={() => {
                const v = clamp(Number(priceInput) || 1000, 1000, 500000);
                updateField('price', v);
                setPriceInput(String(v));
              }}
              min={1000}
              max={500000}
              className="w-36 text-center text-2xl font-bold tabular-nums h-12"
            />
            <span className="text-lg text-muted-foreground">€</span>
          </div>
          <Slider
            value={[formData.price]}
            onValueChange={([v]) => { updateField('price', v); setPriceInput(String(v)); }}
            min={1000}
            max={500000}
            step={500}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1 000 €</span>
            <span>500 000 €</span>
          </div>
        </div>

        {/* Year */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-4">Année</label>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Input
              type="number"
              value={yearInput}
              onChange={e => setYearInput(e.target.value)}
              onBlur={() => {
                const v = clamp(Number(yearInput) || 2022, 2010, 2026);
                updateField('year', v);
                setYearInput(String(v));
              }}
              min={2010}
              max={2026}
              className="w-28 text-center text-2xl font-bold tabular-nums h-12"
            />
          </div>
          <Slider
            value={[formData.year]}
            onValueChange={([v]) => { updateField('year', v); setYearInput(String(v)); }}
            min={2010}
            max={2026}
            step={1}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>2010</span>
            <span>2026</span>
          </div>
        </div>

        {/* Dynamic hint */}
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            💡 Véhicule de <strong>{age} an{age > 1 ? 's' : ''}</strong> — Entretien estimé ~<strong>{entretienEstime} €/an</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceYearStep;
