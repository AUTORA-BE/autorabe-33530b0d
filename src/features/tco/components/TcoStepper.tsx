/** Multi-step TCO form wizard */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TcoFormData, TcoBreakdown, TcoAlternative } from '../types/tco.types';
import FuelTypeStep from './steps/FuelTypeStep';
import PriceYearStep from './steps/PriceYearStep';
import UsageStep from './steps/UsageStep';
import ProfileStep from './steps/ProfileStep';
import RegionInsuranceStep from './steps/RegionInsuranceStep';
import TechnicalStep from './steps/TechnicalStep';
import TcoResults from './results/TcoResults';

interface TcoStepperProps {
  step: number;
  formData: TcoFormData;
  breakdown: TcoBreakdown;
  alternatives: TcoAlternative[];
  showResults: boolean;
  updateField: <K extends keyof TcoFormData>(key: K, value: TcoFormData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const stepTitles = [
  'Type de carburant',
  'Prix & Année',
  'Usage & Kilométrage',
  'Profil conducteur',
  'Région & Assurance',
  'Détails techniques',
  'Résultats',
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const TcoStepper = ({
  step, formData, breakdown, alternatives, showResults,
  updateField, nextStep, prevStep, reset,
}: TcoStepperProps) => {
  if (showResults) {
    return <TcoResults formData={formData} breakdown={breakdown} alternatives={alternatives} onReset={reset} onBack={prevStep} />;
  }

  const progress = ((step + 1) / 7) * 100;

  const renderStep = () => {
    switch (step) {
      case 0: return <FuelTypeStep value={formData.fuelType} onChange={v => { updateField('fuelType', v); nextStep(); }} />;
      case 1: return <PriceYearStep formData={formData} updateField={updateField} />;
      case 2: return <UsageStep formData={formData} updateField={updateField} />;
      case 3: return <ProfileStep formData={formData} updateField={updateField} />;
      case 4: return <RegionInsuranceStep formData={formData} updateField={updateField} />;
      case 5: return <TechnicalStep formData={formData} updateField={updateField} />;
      default: return null;
    }
  };

  return (
    <section className="min-h-screen flex items-start justify-center pt-24 sm:pt-28 pb-20 px-3 sm:px-4">
      <div className="w-full max-w-[680px]">
        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>Étape {step + 1}/7</span>
          <span className="truncate ml-2">{stepTitles[step]}</span>
        </div>
        <div className="h-1 sm:h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-6 sm:mb-8">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Card */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-border/50 bg-card/80 backdrop-blur-2xl shadow-xl p-4 sm:p-10">
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={step}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 sm:mt-10 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 0}
              className="gap-1 text-muted-foreground shrink-0"
            >
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>

            {step !== 0 && (
              <Button
                onClick={nextStep}
                className="h-11 sm:h-12 px-5 sm:px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 text-sm sm:text-base"
              >
                {step === 5 ? '🧮 Voir le résultat →' : 'Continuer →'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TcoStepper;
