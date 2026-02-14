/** TCO calculation hook */

import { useState, useMemo } from 'react';
import type { TcoFormData, TcoBreakdown, TcoAlternative, FuelType } from '../types/tco.types';
import {
  PRIX_CARBURANT, FACTEUR_REALITE, ENTRETIEN_BASE, ASSURANCE_RC,
  COEFF_BONUS, MULT_COUVERTURE, TAXE_REGION, DEPRECIATION, PRIMES,
  DEFAULT_CONSUMPTION,
} from '../constants/belgianData';

const DEFAULT_FORM: TcoFormData = {
  fuelType: 'essence95',
  price: 25000,
  year: 2022,
  usage: 'mixte',
  kmPerYear: 15000,
  ageProfile: 'adulte',
  bonusMalus: 'neutre',
  region: 'bruxelles',
  insuranceType: 'mini_omnium',
  fiscalPower: 7,
  horsepower: 150,
  consumption: 6.5,
  euroNorm: 'euro6',
};

function getFuelCategory(ft: FuelType): string {
  if (ft === 'essence95' || ft === 'essence98') return 'essence';
  if (ft === 'electric') return 'electric';
  return 'diesel';
}

function calculateBreakdown(data: TcoFormData): TcoBreakdown {
  const ageVehicule = 2026 - data.year;
  const totalKm = data.kmPerYear * 5;
  const fuelCat = getFuelCategory(data.fuelType);
  const facteur = FACTEUR_REALITE[data.usage][fuelCat] || 1.1;
  const consoReelle = data.consumption * facteur;

  let carburant: number;
  let prixLitre: number;
  let litresTotal: number;

  if (data.fuelType === 'electric') {
    const coutKwh = 0.8 * 0.35 + 0.2 * 0.55;
    litresTotal = (totalKm / 100) * consoReelle;
    prixLitre = coutKwh;
    carburant = litresTotal * coutKwh;
  } else {
    prixLitre = PRIX_CARBURANT[data.fuelType] || 1.649;
    litresTotal = (totalKm / 100) * consoReelle;
    carburant = litresTotal * prixLitre;
  }

  const entretienAnnuel = ENTRETIEN_BASE[data.fuelType] * (1 + ageVehicule * 0.05);
  const totalEntretien = entretienAnnuel * 5;

  const assuranceAnnuelle = ASSURANCE_RC[data.ageProfile] * COEFF_BONUS[data.bonusMalus] * MULT_COUVERTURE[data.insuranceType];
  const totalAssurance = assuranceAnnuelle * 5;

  const taxeAnnuelle = TAXE_REGION[data.region][data.fuelType] || 200;
  const totalTaxe = taxeAnnuelle * 5;

  const deprec = data.price * (DEPRECIATION[data.fuelType] || 0.45);

  const prime = PRIMES[data.region]?.[data.fuelType] || 0;

  const total = data.price + carburant + totalEntretien + totalAssurance + totalTaxe + deprec - prime;
  const mensuel = Math.round(total / 60);

  return {
    prixAchat: data.price,
    carburant: Math.round(carburant),
    entretien: Math.round(totalEntretien),
    assurance: Math.round(totalAssurance),
    taxe: Math.round(totalTaxe),
    depreciation: Math.round(deprec),
    prime: Math.round(prime),
    total: Math.round(total),
    mensuel,
    details: {
      consoReelle: Math.round(consoReelle * 10) / 10,
      litresTotal: Math.round(litresTotal),
      prixLitre,
      facteurRealite: facteur,
      assuranceAnnuelle: Math.round(assuranceAnnuelle),
      entretienAnnuel: Math.round(entretienAnnuel),
      taxeAnnuelle: Math.round(taxeAnnuelle),
    },
  };
}

export function useTcoCalculator() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TcoFormData>(DEFAULT_FORM);
  const [showResults, setShowResults] = useState(false);

  const updateField = <K extends keyof TcoFormData>(key: K, value: TcoFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const breakdown = useMemo(() => calculateBreakdown(formData), [formData]);

  const alternatives = useMemo((): TcoAlternative[] => {
    const alts: TcoAlternative[] = [];
    const altTypes: { fuel: FuelType; label: string }[] = [
      { fuel: 'electric', label: 'Électrique équivalent' },
      { fuel: 'essence95', label: 'Essence 95 équivalent' },
      { fuel: 'diesel', label: 'Diesel équivalent' },
    ];
    for (const alt of altTypes) {
      if (alt.fuel === formData.fuelType) continue;
      const altData = { ...formData, fuelType: alt.fuel, consumption: DEFAULT_CONSUMPTION[alt.fuel] };
      const altBreakdown = calculateBreakdown(altData);
      alts.push({
        fuelType: alt.fuel,
        label: alt.label,
        breakdown: altBreakdown,
        economie: breakdown.total - altBreakdown.total,
      });
    }
    return alts.slice(0, 2);
  }, [formData, breakdown]);

  const nextStep = () => {
    if (step < 5) setStep(s => s + 1);
    else setShowResults(true);
  };

  const prevStep = () => {
    if (showResults) setShowResults(false);
    else if (step > 0) setStep(s => s - 1);
  };

  const reset = () => {
    setStep(0);
    setFormData(DEFAULT_FORM);
    setShowResults(false);
  };

  return {
    step, setStep, formData, updateField, breakdown, alternatives,
    showResults, nextStep, prevStep, reset,
    setShowResults,
  };
}
