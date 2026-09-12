/**
 * Invariant : une annonce payée passe devant une annonce gratuite, sur TOUS
 * les tris de la recherche.
 *
 * Le bug que ces tests figent : `applySorting` triait bien sur `boost_rank`,
 * mais deux autres chemins de `vehicleQueries` étaient restés sur
 * `boost_level` — le tri « populaire » (favoris / vues / interactions) et la
 * pagination par curseur. Or `boost_level` est du TEXTE : en ordre décroissant
 * 'none' passe avant 'boost_*' parce que « n » > « b ». Ces deux chemins
 * servaient donc les annonces GRATUITES en premier et repoussaient les
 * payantes en fin de tri SQL — exactement l'inverse de ce que le vendeur a
 * payé, et sans la moindre erreur visible.
 *
 * Le tri client (`[...boosted, ...nonBoosted]`) ne réordonne que la page déjà
 * rapatriée : il ne rattrape rien, puisque c'est l'ordre SQL qui décide quelles
 * annonces entrent dans la page.
 */

import { describe, it, expect } from 'vitest';
import {
  BOOST_ORDER_COLUMN,
  POPULARITY_SORTS,
  applyBoostPriority,
  applyCursorSorting,
  applyPopularitySorting,
  applySorting,
  isPopularitySort,
} from './vehicleQueries';
import type { VehicleSortOption } from '../types/vehicle.types';

/** Tous les tris proposés par l'interface. */
const TOUS_LES_TRIS: VehicleSortOption[] = [
  'recent', 'price-asc', 'price-desc', 'year-desc', 'year-asc',
  'km-asc', 'km-desc', 'favorites', 'views', 'interactions',
];

interface Appel {
  colonne: string;
  options?: { ascending?: boolean; nullsFirst?: boolean };
}

/** Constructeur de requête factice : il n'enregistre que les `order()`. */
function fausseRequete() {
  const appels: Appel[] = [];
  const q = {
    appels,
    order(colonne: string, options?: Appel['options']) {
      appels.push({ colonne, options });
      return q;
    },
    limit() {
      return q;
    },
  };
  return q;
}

/** Trie comme le fait `vehicleQueries.list`, en suivant le même aiguillage. */
function ordresPour(sortBy: VehicleSortOption): Appel[] {
  const q = fausseRequete();
  if (isPopularitySort(sortBy)) applyPopularitySorting(q);
  else applySorting(q, sortBy);
  return q.appels;
}

describe('les annonces payées passent devant, sur tous les tris', () => {
  it('couvre bien les dix tris de l\'interface', () => {
    expect(TOUS_LES_TRIS).toHaveLength(10);
    expect(TOUS_LES_TRIS.filter(isPopularitySort)).toEqual([...POPULARITY_SORTS]);
  });

  for (const sortBy of TOUS_LES_TRIS) {
    it(`« ${sortBy} » commence par le rang de boost, décroissant`, () => {
      const [premier] = ordresPour(sortBy);
      expect(premier?.colonne).toBe(BOOST_ORDER_COLUMN);
      expect(premier?.options?.ascending).toBe(false);
    });
  }

  it('la pagination par curseur aussi', () => {
    const q = fausseRequete();
    applyCursorSorting(q);
    expect(q.appels.map((a) => a.colonne)).toEqual([BOOST_ORDER_COLUMN, 'created_at', 'id']);
    expect(q.appels[0].options?.ascending).toBe(false);
  });

  it('aucun tri n\'utilise boost_level, jamais', () => {
    const colonnes = TOUS_LES_TRIS.flatMap((s) => ordresPour(s).map((a) => a.colonne));
    const qCurseur = fausseRequete();
    applyCursorSorting(qCurseur);
    colonnes.push(...qCurseur.appels.map((a) => a.colonne));

    expect(colonnes).not.toContain('boost_level');
  });
});

describe('pourquoi boost_level ne peut pas servir de critère de tri', () => {
  it('en ordre décroissant, « none » passe devant les boosts payés', () => {
    const niveaux = ['none', 'boost_24h', 'boost_48h', 'boost_72h', 'boost_7d'];
    const decroissant = [...niveaux].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

    // C'est le piège : la gratuite arrive première.
    expect(decroissant[0]).toBe('none');
  });

  it('le rang numérique, lui, ordonne les paliers comme la base les génère', () => {
    // Colonne générée : boost_7d=4, boost_72h=3, boost_48h=2, boost_24h=1, none=0.
    const rangs = [0, 1, 2, 3, 4];
    const decroissant = [...rangs].sort((a, b) => b - a);

    expect(decroissant[0]).toBe(4);
    expect(decroissant[decroissant.length - 1]).toBe(0);
  });
});

describe('le point d\'entrée unique', () => {
  it('applyBoostPriority est le seul endroit qui nomme la colonne', () => {
    const q = fausseRequete();
    applyBoostPriority(q);
    expect(q.appels).toEqual([
      { colonne: 'boost_rank', options: { ascending: false, nullsFirst: false } },
    ]);
  });
});
