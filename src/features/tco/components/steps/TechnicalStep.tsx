/** Step 6: Technical details */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {  EURO_NORMS } from '../../constants/belgianData';
import type {  TcoFormData } from '../../types/tco.types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface Props {
  formData: TcoFormData;
  updateField: <K extends keyof TcoFormData>(key: K, val: TcoFormData[K]) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Belgian fiscal power approximation from HP (kW = ch * 0.7355).
// Rough mapping: CV fiscaux ≈ round(kW / 8) + 2, clamped 4..20.
const deriveFiscalPower = (hp: number) => {
  const kw = hp * 0.7355;
  return clamp(Math.round(kw / 8) + 2, 4, 20);
};

const TechnicalStep = ({ formData, updateField }: Props) => {
  const isElectric = formData.fuelType === 'electric';
  const consoUnit = isElectric ? 'kWh/100km' : 'L/100km';

  const [fpInput, setFpInput] = useState(String(formData.fiscalPower));
  const [hpInput, setHpInput] = useState(String(formData.horsepower));
  const [consoInput, setConsoInput] = useState(String(formData.consumption));
  const [fpTouched, setFpTouched] = useState(false);

  const syncFromHp = (hp: number) => {
    updateField('horsepower', hp);
    setHpInput(String(hp));
    if (!fpTouched) {
      const fp = deriveFiscalPower(hp);
      updateField('fiscalPower', fp);
      setFpInput(String(fp));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Détails techniques</h2>
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-8">
        <p className="text-sm text-primary">
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
          <div className="flex items-center justify-center gap-2 mb-3">
            <Input
              type="number"
              value={fpInput}
              onChange={e => setFpInput(e.target.value)}
              onBlur={() => {
                const v = clamp(Math.round(Number(fpInput) || 7), 4, 20);
                updateField('fiscalPower', v);
                setFpInput(String(v));
              }}
              min={4}
              max={20}
              className="w-20 text-center text-2xl font-bold tabular-nums h-12"
            />
            <span className="text-sm text-muted-foreground">CV</span>
          </div>
          <Slider
            value={[formData.fiscalPower]}
            onValueChange={([v]) => { updateField('fiscalPower', v); setFpInput(String(v)); }}
            min={4}
            max={20}
            step={1}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-primary"
          />
        </div>

        {/* Horsepower */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm font-medium text-foreground">Puissance (chevaux)</label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Puissance du moteur en chevaux (ch/HP)</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Input
              type="number"
              value={hpInput}
              onChange={e => setHpInput(e.target.value)}
              onBlur={() => {
                const v = clamp(Math.round(Number(hpInput) || 150), 50, 800);
                updateField('horsepower', v);
                setHpInput(String(v));
              }}
              min={50}
              max={800}
              className="w-24 text-center text-2xl font-bold tabular-nums h-12"
            />
            <span className="text-sm text-muted-foreground">ch</span>
          </div>
          <Slider
            value={[formData.horsepower]}
            onValueChange={([v]) => { updateField('horsepower', v); setHpInput(String(v)); }}
            min={50}
            max={800}
            step={1}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-primary"
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
          <div className="flex items-center justify-center gap-2 mb-3">
            <Input
              type="number"
              value={consoInput}
              onChange={e => setConsoInput(e.target.value)}
              onBlur={() => {
                const min = isElectric ? 12 : 2;
                const max = isElectric ? 25 : 20;
                const v = clamp(Math.round((Number(consoInput) || 6.5) * 10) / 10, min, max);
                updateField('consumption', v);
                setConsoInput(String(v));
              }}
              min={isElectric ? 12 : 2}
              max={isElectric ? 25 : 20}
              step={0.1}
              className="w-24 text-center text-2xl font-bold tabular-nums h-12"
            />
            <span className="text-sm text-muted-foreground">{consoUnit}</span>
          </div>
          <Slider
            value={[formData.consumption * 10]}
            onValueChange={([v]) => { const val = v / 10; updateField('consumption', val); setConsoInput(String(val)); }}
            min={isElectric ? 120 : 20}
            max={isElectric ? 250 : 200}
            step={1}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-primary"
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
                      ? 'border-primary bg-primary/10 font-semibold text-foreground'
                      : 'border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/50'
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
