/** Calculateur TCO page */

import { useState } from 'react';
import Header from '@/shared/components/Header';
import Footer from '@/shared/components/Footer';
import { BackButton } from '@/shared/components';
import SEOHead from '@/components/SEOHead';
import TcoHero from '@/features/tco/components/TcoHero';
import TcoStepper from '@/features/tco/components/TcoStepper';
import { useTcoCalculator } from '@/features/tco';
import { webApplicationSchema, breadcrumbSchema, faqSchema } from '@/lib/seoSchemas';

const CalculateurTCO = () => {
  const [started, setStarted] = useState(false);
  const calc = useTcoCalculator();

  return (
    <>
      <SEOHead
        title="Calculateur TCO Belgique — Coût réel voiture sur 5 ans"
        description="Calculez le vrai coût de votre voiture en Belgique : achat, carburant, entretien, assurance, taxes régionales (Wallonie, Bruxelles, Flandre). Données 2026. Gratuit."
        url="https://autora.be/calculateur-tco"
        jsonLd={[
          webApplicationSchema({
            name: "Calculateur TCO Auto Belgique",
            description: "Calculateur gratuit du coût total de possession (TCO) d'une voiture en Belgique sur 5 ans : achat, carburant, taxes régionales, entretien, assurance.",
            url: "https://autora.be/calculateur-tco",
          }),
          breadcrumbSchema([
            { name: "Accueil", url: "https://autora.be" },
            { name: "Calculateur TCO", url: "https://autora.be/calculateur-tco" },
          ]),
          faqSchema([
            { question: "Qu'est-ce que le TCO d'une voiture ?", answer: "Le TCO (Total Cost of Ownership) est le coût total de possession d'un véhicule sur sa durée d'utilisation : prix d'achat, carburant, entretien, assurance, taxes (TMC + circulation annuelle), dépréciation et primes régionales." },
            { question: "La taxe TMC est-elle incluse ?", answer: "Oui, le calculateur intègre la Taxe de Mise en Circulation (TMC) selon votre région : Wallonie, Bruxelles ou Flandre, avec les coefficients de réduction par âge du véhicule." },
            { question: "Le calcul est-il à jour pour 2026 ?", answer: "Oui, les barèmes TMC, taxes annuelles, prix carburants et primes véhicules propres sont mis à jour régulièrement à partir de sources officielles belges." },
            { question: "Pourquoi un véhicule électrique peut être moins cher qu'un thermique ?", answer: "Sur 5 ans, l'électrique cumule taxe annuelle minimale, primes régionales (Wallonie/Bruxelles), coût énergétique réduit et entretien moindre — souvent moins de 1 500 €/an d'écart en faveur de l'électrique." },
          ]),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-24 pb-2">
          <BackButton to="/" className="mb-2" />
        </div>
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
