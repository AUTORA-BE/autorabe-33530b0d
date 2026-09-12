/**
 * Contrat entre le chatbot fiscal (`supabase/functions/explain-taxes`) et le
 * moteur fiscal du calculateur (`src/lib/belgianTax.ts`).
 *
 * Le bug que ces tests figent : `explain-taxes` envoyait le contexte du
 * véhicule au modèle SANS aucun barème, tout en lui faisant écrire que ses
 * réponses étaient « basées sur les barèmes publics ». Le modèle produisait
 * donc des montants inventés, présentés comme officiels, et pouvant
 * contredire le calculateur affiché sur la même page.
 *
 * Deux propriétés sont vérifiées ici :
 *   1. tout montant injecté dans le prompt est EXACTEMENT celui que le moteur
 *      produirait pour le même véhicule ;
 *   2. quand le moteur ne sait pas chiffrer, le prompt le dit et n'expose
 *      aucun montant — c'est ce qui empêche le modèle de combler le vide.
 */

import { describe, it, expect } from 'vitest';
import * as facts from '../../supabase/functions/_shared/belgianTaxFacts';
import {
  calculerTMC,
  calculerTaxeCirculation,
  BAREME_VALIDE_DEPUIS,
  BAREME_VALIDE_JUSQUAU,
  TC_MINIMUM,
  TC_20CV,
  TC_PAR_CV_AU_DELA_DE_20,
  SIMULATEURS_OFFICIELS,
  type Region,
  type VehiculeFiscal,
} from './belgianTax';
import { ageDepuisAnnee, chToKw, mapCarburant } from './belgianTaxHelpers';

const REGIONS: Region[] = ['bruxelles', 'wallonie', 'flandre'];
/** Libellés tels qu'ils arrivent de l'edge function (déjà assainis). */
const CARBURANTS = ['essence', 'diesel', 'hybride', 'electrique', 'lpg', 'cng'];
const PUISSANCES_CH: Array<number | null> = [null, 60, 95, 110, 136, 150, 163, 211, 300];
const AGES = [0, 1, 2, 5, 9, 12, 20];

/**
 * Le véhicule tel que le calculateur le verrait avec les SEULES données dont
 * le chat dispose : ni CO₂, ni masse, ni puissance fiscale.
 */
function vehiculeEquivalent(e: facts.EntreeFiscale): VehiculeFiscal {
  return {
    region: e.region as Region,
    puissanceKw: chToKw(e.puissanceCh),
    puissanceCv: null,
    co2: null,
    cycleCO2: 'WLTP',
    mma: null,
    carburant: mapCarburant(e.fuelType),
    euroNorm: null,
    ageAnnees: e.ageAnnees,
  };
}

function toutesLesEntrees(): facts.EntreeFiscale[] {
  const entrees: facts.EntreeFiscale[] = [];
  for (const region of REGIONS) {
    for (const fuelType of CARBURANTS) {
      for (const puissanceCh of PUISSANCES_CH) {
        for (const ageAnnees of AGES) {
          entrees.push({ region, fuelType, puissanceCh, ageAnnees });
        }
      }
    }
  }
  return entrees;
}

describe('les barèmes injectés au chat sont ceux du calculateur', () => {
  it('reprend la même période de validité et les mêmes constantes', () => {
    expect(facts.BAREME_VALIDE_DEPUIS).toBe(BAREME_VALIDE_DEPUIS);
    expect(facts.BAREME_VALIDE_JUSQUAU).toBe(BAREME_VALIDE_JUSQUAU);
    expect(facts.TC_MINIMUM).toBe(TC_MINIMUM);
    expect(facts.TC_20CV).toBe(TC_20CV);
    expect(facts.TC_PAR_CV_AU_DELA_DE_20).toBe(TC_PAR_CV_AU_DELA_DE_20);
    expect(facts.SIMULATEURS_OFFICIELS).toEqual(SIMULATEURS_OFFICIELS);
  });

  it('traduit carburant, puissance et âge exactement comme l\'app', () => {
    const libelles = [
      'essence', 'Essence', 'diesel', 'Diesel', 'hybride', 'hybride-rechargeable',
      'electrique', 'Électrique', 'electric', 'ev', 'lpg', 'gpl', 'cng', 'gnc',
      'gaz naturel', 'hydrogene', 'Hydrogène', 'petrol', 'gasoline', 'inconnu', '',
    ];
    for (const l of libelles) expect(facts.mapCarburant(l)).toBe(mapCarburant(l));
    for (const ch of [null, 0, 1, 60, 95, 130, 163, 300, 750]) expect(facts.chToKw(ch)).toBe(chToKw(ch));
    for (const y of [null, 0, 1998, 2015, 2026, 2030]) expect(facts.ageDepuisAnnee(y)).toBe(ageDepuisAnnee(y));
  });

  it('annonce pour la TMC / BIV exactement le montant du calculateur', () => {
    const ecarts: string[] = [];
    for (const e of toutesLesEntrees()) {
      const chat = facts.ancrageTMC(e);
      const moteur = calculerTMC(vehiculeEquivalent(e));
      const cas = `${e.region}/${e.fuelType}/${e.puissanceCh ?? 'sans'}ch/${e.ageAnnees}a`;
      if (chat.montant !== moteur.montant) {
        ecarts.push(`${cas} : chat ${chat.montant} vs moteur ${moteur.montant}`);
      }
      if (chat.source !== moteur.source) ecarts.push(`${cas} : source divergente`);
    }
    expect(ecarts).toEqual([]);
  });

  it('annonce pour la taxe de circulation exactement le montant du calculateur', () => {
    const ecarts: string[] = [];
    for (const e of toutesLesEntrees()) {
      const chat = facts.ancrageTaxeCirculation(e);
      const moteur = calculerTaxeCirculation(vehiculeEquivalent(e));
      if (chat.montant !== moteur.montant) {
        ecarts.push(`${e.region}/${e.fuelType}/${e.ageAnnees}a : chat ${chat.montant} vs moteur ${moteur.montant}`);
      }
    }
    expect(ecarts).toEqual([]);
  });

  it('refuse de chiffrer quand le libellé de carburant n\'est pas reconnu', () => {
    const e: facts.EntreeFiscale = {
      region: 'bruxelles', fuelType: 'inconnu', puissanceCh: 130, ageAnnees: 2,
    };
    expect(facts.ancrageTMC(e).montant).toBeNull();
    expect(facts.ancrageTaxeCirculation(e).montant).toBeNull();
  });
});

/** Un 12 septembre 2026 : le barème 01/07/2026 – 30/06/2027 est en vigueur. */
const LE_JOUR = new Date('2026-09-12T12:00:00Z');

const PEUGEOT_308: facts.ContexteVehicule = {
  brand: 'Peugeot', model: '308', year: 2020, fuelType: 'diesel',
  power: 130, euroNorm: 'Euro 6', region: 'bruxelles',
};

describe('le prompt système de explain-taxes', () => {
  it('ne prétend plus que ses montants sont « basés sur les barèmes publics »', () => {
    const prompt = facts.construirePromptSysteme(PEUGEOT_308, LE_JOUR);
    expect(prompt).not.toMatch(/barèmes publics/i);
    expect(prompt).not.toMatch(/donne une fourchette/i);
    expect(prompt).not.toMatch(/montants estimatifs/i);
  });

  it('injecte le barème et le montant exact que le calculateur produirait', () => {
    const prompt = facts.construirePromptSysteme(PEUGEOT_308, LE_JOUR);
    const attendu = facts.ancrageTMC({
      region: 'bruxelles', fuelType: 'diesel', puissanceCh: 130, ageAnnees: 6,
    });

    expect(attendu.montant).not.toBeNull();
    expect(prompt).toContain('BARÈMES AUTORA');
    expect(prompt).toContain('01/07/2026');
    expect(prompt).toContain(facts.eur(attendu.montant as number));
    expect(prompt).toContain('SEULE source de montants');
  });

  it('dit « non calculable » et n\'expose aucun montant quand la donnée manque', () => {
    const bloc = facts.construireBlocFiscal(
      { region: 'wallonie', fuelType: 'diesel', puissanceCh: 130, ageAnnees: 6 },
      LE_JOUR,
    );

    expect(bloc).toContain('NON CALCULABLE');
    expect(bloc).toContain('masse maximale autorisée (kg)');
    expect(bloc).toContain('pas même une fourchette');
    // La preuve du correctif : rien à recopier, donc rien à inventer.
    expect(bloc).not.toContain('€');
  });

  it('signale les limites du moteur au lieu de les laisser combler par le modèle', () => {
    const prompt = facts.construirePromptSysteme({ ...PEUGEOT_308, region: 'flandre' }, LE_JOUR);
    expect(prompt).toContain('non implémenté par AutoRA');
    expect(prompt).toContain('barème intermédiaire non intégré par AutoRA');
  });

  it('interdit tout montant lorsque le barème est périmé', () => {
    const prompt = facts.construirePromptSysteme(PEUGEOT_308, new Date('2027-08-01T00:00:00Z'));
    expect(prompt).toContain('PÉRIMÉS');
  });
});
