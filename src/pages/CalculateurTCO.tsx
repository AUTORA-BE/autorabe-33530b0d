/** Calculateur TCO page */

import { useState } from 'react';
import Header from '@/shared/components/Header';
import Footer from '@/shared/components/Footer';
import SEOHead from '@/components/SEOHead';
import TcoHero from '@/features/tco/components/TcoHero';
import TcoStepper from '@/features/tco/components/TcoStepper';
import { useTcoCalculator } from '@/features/tco';

const CalculateurTCO = () => {
  const [started, setStarted] = useState(false);
  const calc = useTcoCalculator();

  return (
    <>
      <SEOHead
        title="Calculateur TCO - Coût Réel Voiture 5 ans"
        description="Calculez le vrai coût de votre voiture : achat, carburant, entretien, assurance, taxes. Données officielles Belgique 2026. Gratuit et précis."
        url="https://autora.be/calculateur-tco"
      />
      <Header />
      <main className="min-h-screen bg-background">
        {!started && !calc.showResults ? (
          <TcoHero onStart={() => setStarted(true)} />
        ) : (
          <TcoStepper
            step={calc.step}
            formData={calc.formData}
            breakdown={calc.breakdown}
            alternatives={calc.alternatives}
            showResults={calc.showResults}
            updateField={calc.updateField}
            nextStep={calc.nextStep}
            prevStep={() => {
              if (calc.step === 0 && !calc.showResults) {
                setStarted(false);
              } else {
                calc.prevStep();
              }
            }}
            reset={() => { calc.reset(); setStarted(false); }}
          />
        )}
      </main>
      <Footer />
    </>
  );
};

export default CalculateurTCO;
