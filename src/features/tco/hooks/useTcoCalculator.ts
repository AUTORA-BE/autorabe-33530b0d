/** TCO calculation hook */

import { useState, useMemo } from 'react';
import type { TcoFormData, TcoBreakdown, TcoAlternative, FuelType } from '../types/tco.types';
import {
  PRIX_CARBURANT, FACTEUR_REALITE, ENTRETIEN_BASE, ASSURANCE_RC,
  COEFF_BONUS, MULT_COUVERTURE, DEPRECIATION, PRIMES,
  DEFAULT_CONSUMPTION,
} from '../constants/belgianData';
import { calculerTaxeCirculation, type Region as RegionFiscale, type ResultatTaxe } from '@/lib/belgianTax';
import { mapCarburant, normaliserCycle } from '@/lib/belgianTaxHelpers';

export const DEFAULT_FORM: TcoFormData = {
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

/**
 * Taxe de circulation via le moteur fiscal officiel. `montant` vaut null quand
 * le barème ne permet pas de trancher — on n'invente aucun montant.
 */
function taxeCirculation(data: TcoFormData): ResultatTaxe {
  return calculerTaxeCirculation({
    region: data.region as RegionFiscale,
    puissanceCv: data.fiscalPower || null,
    puissanceKw: data.horsepower ? Math.round(data.horsepower * 0.7355) : null,
    carburant: mapCarburant(data.fuelType === 'electric' ? 'electrique' : data.fuelType),
    cycleCO2: normaliserCycle(null),
    euroNorm: data.euroNorm ?? null,
    ageAnnees: Math.max(0, new Date().getFullYear() - data.year),
  });
}

/** Motif d'un montant null, repris tel quel du moteur fiscal (source unique). */
function motifNonCalcul(resultat: ResultatTaxe): string {
  return resultat.donneesManquantes.length > 0
    ? resultat.donneesManquantes.join(' · ')
    : 'barème non disponible pour ce véhicule';
}

export function calculateBreakdown(data: TcoFormData): TcoBreakdown {
  const ageVehicule = new Date().getFullYear() - data.year;
  const totalKm = data.kmPerYear * 5;
  const fuelCat = getFuelCategory(data.fuelType);
  const facteur = FACTEUR_REALITE[data.usage][fuelCat] || 1.1;
  const consoReelle = data.consumption * facteur;

  let carburant: number;
  let prixLitre: number;
  let litresTotal: number;

  if (data.fuelType === 'electric') {
    const coutKwh = 0.8 * PRIX_CARBURANT.electric_domicile + 0.2 * PRIX_CARBURANT.electric_public;
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

  // Taxe de circulation : quand le moteur fiscal ne tranche pas (null), elle est
  // EXCLUE du total et signalée « non calculée » — jamais comptée comme 0 €.
  const taxe = taxeCirculation(data);
  const taxeAnnuelle = taxe.montant;
  const totalTaxe = taxeAnnuelle === null ? null : taxeAnnuelle * 5;

  const deprec = data.price * (DEPRECIATION[data.fuelType] || 0.45);

  const prime = PRIMES[data.region]?.[data.fuelType] || 0;

  const totalHorsTaxe = deprec + carburant + totalEntretien + totalAssurance - prime;
  const total = totalTaxe === null
    ? totalHorsTaxe
    : deprec + carburant + totalEntretien + totalAssurance + totalTaxe - prime;
  const mensuel = Math.round(total / 60);

  return {
    prixAchat: data.price,
    carburant: Math.round(carburant),
    entretien: Math.round(totalEntretien),
    assurance: Math.round(totalAssurance),
    taxe: totalTaxe === null ? null : Math.round(totalTaxe),
    motifTaxeNonCalculee: taxeAnnuelle === null ? motifNonCalcul(taxe) : null,
    depreciation: Math.round(deprec),
    prime: Math.round(prime),
    total: Math.round(total),
    totalHorsTaxe: Math.round(totalHorsTaxe),
    mensuel,
    details: {
      consoReelle: Math.round(consoReelle * 10) / 10,
      litresTotal: Math.round(litresTotal),
      prixLitre,
      facteurRealite: facteur,
      assuranceAnnuelle: Math.round(assuranceAnnuelle),
      entretienAnnuel: Math.round(entretienAnnuel),
      taxeAnnuelle: taxeAnnuelle === null ? null : Math.round(taxeAnnuelle),
    },
  };
}

/**
 * Alternatives de motorisation. L'économie compare des totaux à base égale :
 * si la taxe de circulation n'est pas calculée d'un côté au moins, les deux
 * totaux sont comparés hors taxe de circulation (et c'est signalé).
 */
export function calculateAlternatives(formData: TcoFormData, breakdown: TcoBreakdown): TcoAlternative[] {
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
    const economieHorsTaxe = breakdown.taxe === null || altBreakdown.taxe === null;
    alts.push({
      fuelType: alt.fuel,
      label: alt.label,
      breakdown: altBreakdown,
      economie: economieHorsTaxe
        ? breakdown.totalHorsTaxe - altBreakdown.totalHorsTaxe
        : breakdown.total - altBreakdown.total,
      economieHorsTaxe,
    });
  }
  return alts.slice(0, 2);
}

export function useTcoCalculator() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TcoFormData>(DEFAULT_FORM);
  const [showResults, setShowResults] = useState(false);

  const updateField = <K extends keyof TcoFormData>(key: K, value: TcoFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const breakdown = useMemo(
    () => calculateBreakdown(formData),
    [formData]
  );

  const alternatives = useMemo(
    (): TcoAlternative[] => calculateAlternatives(formData, breakdown),
    [formData, breakdown]
  );

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
