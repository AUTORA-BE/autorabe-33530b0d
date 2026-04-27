/** Step 5: Region & Insurance */

import {  TAXE_REGION } from '../../constants/belgianData';
import type { TcoFormData, Region, InsuranceType } from '../../types/tco.types';

interface Props {
  formData: TcoFormData;
  updateField: <K extends keyof TcoFormData>(key: K, val: TcoFormData[K]) => void;
}

const regionOptions: { value: Region; icon: string; label: string; desc: string }[] = [
  { value: 'bruxelles', icon: '🏙️', label: 'Bruxelles', desc: 'Taxes élevées · LEZ strict' },
  { value: 'flandre', icon: '🌾', label: 'Flandre', desc: 'LEZ strict Anvers & Gand' },
  { value: 'wallonie', icon: '🌲', label: 'Wallonie', desc: 'Taxes basses' },
];

const insuranceOptions: { value: InsuranceType; label: string; price: string; rec?: boolean }[] = [
  { value: 'rc', label: 'RC Seule', price: '~450€/an' },
  { value: 'mini_omnium', label: 'Mini Omnium', price: '~750€/an', rec: true },
  { value: 'omnium', label: 'Omnium', price: '~1 200€/an' },
];

const RegionInsuranceStep = ({ formData, updateField }: Props) => {
  const taxe = TAXE_REGION[formData.region]?.[formData.fuelType] || 200;

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Région & Assurance</h2>
      <p className="text-muted-foreground mb-8">Votre région et type de couverture</p>

      <div className="space-y-8">
        {/* Region — stack on very small screens */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {regionOptions.map(opt => {
            const sel = formData.region === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateField('region', opt.value)}
                className={`p-3 sm:p-4 rounded-2xl border-2 text-center transition-all ${
                  sel
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-secondary/30 hover:border-primary/50'
                }`}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="text-sm font-semibold text-foreground leading-tight">{opt.label}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-tight">{opt.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Dynamic info */}
        <div className="p-3 rounded-xl bg-secondary/50 text-center">
          <p className="text-xs text-muted-foreground">Taxe circulation</p>
          <p className="text-lg font-bold text-foreground">{taxe} €/an</p>
        </div>

        {/* Insurance */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-3">Type d'assurance</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {insuranceOptions.map(opt => {
              const sel = formData.insuranceType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateField('insuranceType', opt.value)}
                  className={`relative p-3 sm:p-4 rounded-2xl border-2 text-center transition-all ${
                    sel
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 bg-secondary/30 hover:border-primary/50'
                  }`}
                >
                  {opt.rec && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                      ⭐ Recommandé
                    </span>
                  )}
                  <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{opt.label}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{opt.price}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionInsuranceStep;
