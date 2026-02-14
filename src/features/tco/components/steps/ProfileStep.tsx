/** Step 4: Driver profile */

import { Slider } from '@/components/ui/slider';
import { COEFF_BONUS } from '../../constants/belgianData';
import type { TcoFormData, AgeProfile, BonusMalus } from '../../types/tco.types';

interface Props {
  formData: TcoFormData;
  updateField: <K extends keyof TcoFormData>(key: K, val: TcoFormData[K]) => void;
}

const ageOptions: { value: AgeProfile; icon: string; label: string; range: string }[] = [
  { value: 'jeune', icon: '👶', label: 'Jeune', range: '< 26 ans' },
  { value: 'adulte', icon: '👔', label: 'Adulte', range: '26-65 ans' },
  { value: 'senior', icon: '👴', label: 'Senior', range: '> 65 ans' },
];

const bonusSteps: BonusMalus[] = ['bonus-3', 'bonus-2', 'bonus-1', 'neutre', 'malus+1', 'malus+2'];

const ProfileStep = ({ formData, updateField }: Props) => {
  const bonusIndex = bonusSteps.indexOf(formData.bonusMalus);
  const coeff = COEFF_BONUS[formData.bonusMalus];
  const reductionPct = Math.round((1 - coeff) * 100);

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">Profil conducteur</h2>
      <p className="text-muted-foreground mb-8">Âge et bonus-malus assurance</p>

      <div className="space-y-10">
        {/* Age profile */}
        <div className="grid grid-cols-3 gap-3">
          {ageOptions.map(opt => {
            const sel = formData.ageProfile === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateField('ageProfile', opt.value)}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  sel
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-secondary/30 hover:border-primary/50'
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.range}</div>
              </button>
            );
          })}
        </div>

        {/* Bonus-Malus */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-4">Bonus-Malus</label>
          <Slider
            value={[bonusIndex]}
            onValueChange={([v]) => updateField('bonusMalus', bonusSteps[v])}
            min={0}
            max={5}
            step={1}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_span:first-child>span]:bg-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span className="text-primary">Bonus -3</span>
            <span>Neutre</span>
            <span className="text-red-500">Malus +2</span>
          </div>
          <div className="mt-4 text-center p-3 rounded-xl bg-secondary/50">
            <p className="text-sm text-muted-foreground">
              {reductionPct > 0 && <span className="text-primary font-semibold">Réduction {reductionPct}%</span>}
              {reductionPct === 0 && <span className="text-foreground font-semibold">Tarif neutre</span>}
              {reductionPct < 0 && <span className="text-red-500 font-semibold">Surcharge {Math.abs(reductionPct)}%</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStep;
