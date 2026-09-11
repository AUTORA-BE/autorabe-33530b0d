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
import { BAREME_VALIDE_DEPUIS, BAREME_VALIDE_JUSQUAU } from '@/lib/belgianTax';

/** "2026-07-01" → "01/07/2026", sans dépendre du fuseau horaire du navigateur. */
const dateBareme = (iso: string) => iso.split('-').reverse().join('/');

const CalculateurTCO = () => {
  const [started, setStarted] = useState(false);
  const calc = useTcoCalculator();

  return (
    <>
      <SEOHead
        title="Calculateur TCO Belgique — Coût réel voiture sur 5 ans"
        description="Calculez le vrai coût de votre voiture en Belgique sur 5 ans : dépréciation, carburant, entretien, assurance et taxe de circulation. Données 2026. Gratuit."
        url="https://autora.be/calculateur-tco"
        jsonLd={[
          webApplicationSchema({
            name: "Calculateur TCO Auto Belgique",
            description: "Calculateur gratuit du coût total de possession (TCO) d'une voiture en Belgique sur 5 ans : dépréciation, carburant, entretien, assurance et taxe de circulation.",
            url: "https://autora.be/calculateur-tco",
          }),
          breadcrumbSchema([
            { name: "Accueil", url: "https://autora.be" },
            { name: "Calculateur TCO", url: "https://autora.be/calculateur-tco" },
          ]),
          faqSchema([
            { question: "Qu'est-ce que le TCO d'une voiture ?", answer: "Le TCO (Total Cost of Ownership) est le coût total de possession d'un véhicule sur une période donnée. Le calculateur AutoRA l'estime sur 5 ans : perte de valeur (dépréciation), carburant ou électricité, entretien, assurance, et taxe de circulation annuelle lorsque son barème est intégré pour votre véhicule." },
            { question: "La taxe TMC est-elle incluse ?", answer: "Non. La taxe de mise en circulation (TMC en Wallonie et à Bruxelles, BIV en Flandre) se paie une fois, lors de l'immatriculation du véhicule à votre nom : elle n'est pas comptée dans le TCO. Elle est estimée à part sur la fiche de chaque véhicule, quand ses données le permettent." },
            { question: "Le calcul est-il à jour pour 2026 ?", answer: `Le barème de taxe de circulation intégré est celui en vigueur du ${dateBareme(BAREME_VALIDE_DEPUIS)} au ${dateBareme(BAREME_VALIDE_JUSQUAU)} ; il est indexé chaque 1er juillet. Les autres postes (carburant, entretien, assurance, dépréciation) sont des estimations indicatives.` },
            { question: "Pourquoi un véhicule électrique peut être moins cher qu'un thermique ?", answer: "Sur 5 ans, un électrique paie en général la taxe de circulation au forfait minimum (Bruxelles et Wallonie), coûte moins cher en énergie au kilomètre et demande moins d'entretien. Le calculateur compare les motorisations à prix d'achat et usage identiques ; un électrique souvent plus cher à l'achat réduit l'écart réel." },
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
