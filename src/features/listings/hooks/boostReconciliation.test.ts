/**
 * Rattrapage des boosts payés : ce que la réconciliation doit décider.
 *
 * Le trou que ces tests figent : un boost n'est activé que par
 * `payments-webhook`. Aucune table ne garde trace d'un paiement de boost — si
 * la livraison du webhook est perdue, le client a payé, rien n'arrive, et rien
 * nulle part ne le sait. La réconciliation relit les sessions payées chez
 * Stripe et applique ce qui manque.
 *
 * Les deux propriétés qui comptent :
 *   1. un webhook perdu est rattrapé ;
 *   2. il n'est rattrapé QU'UNE FOIS — ni sur un second passage, ni quand le
 *      webhook avait finalement fait son travail.
 *
 * L'idempotence dure est côté base (`apply_paid_boost`, marqueur unique par
 * session, prouvé en base). Ici on fige la décision, y compris les cas où il
 * faut alerter plutôt qu'agir.
 */

import { describe, it, expect } from 'vitest';
import {
  type AnnonceBoost,
  type SessionBoost,
  annoncesAConsulter,
  decider,
  marqueurDe,
  sessionDuMarqueur,
} from '../../../../supabase/functions/_shared/boostReconciliation';
import { lireResultatRattrapage } from './useBoostReconciliation';

const T0 = new Date('2026-09-12T00:00:00.000Z').getTime();
const HEURE = 3_600_000;
const iso = (heures: number) => new Date(T0 + heures * HEURE).toISOString();

const VENDEUR = '11111111-1111-1111-1111-111111111111';
const AUTRE_VENDEUR = '22222222-2222-2222-2222-222222222222';
const ANNONCE = '33333333-3333-3333-3333-333333333333';

function session(p: Partial<SessionBoost> = {}): SessionBoost {
  return {
    id: 'cs_test_1',
    listingId: ANNONCE,
    userId: VENDEUR,
    level: 'boost_24h',
    hours: 24,
    paidAt: iso(0),
    ...p,
  };
}

function annonce(p: Partial<AnnonceBoost> = {}): AnnonceBoost {
  return { id: ANNONCE, userId: VENDEUR, boostLevel: 'none', boostExpiresAt: null, ...p };
}

/** Une heure après le paiement : le webhook a eu tout le temps d'arriver. */
const UNE_HEURE_APRES = { maintenant: new Date(T0 + 1 * HEURE) };

describe('webhook perdu : le boost payé est rattrapé', () => {
  it('applique le boost quand rien ne l\'a activé', () => {
    const d = decider([session()], [annonce()], [], UNE_HEURE_APRES);
    expect(d).toEqual([
      { action: 'appliquer', session: session(), listingId: ANNONCE, level: 'boost_24h', hours: 24 },
    ]);
  });

  it('ne le rattrape pas une seconde fois : le marqueur de session suffit', () => {
    const s = session();
    const premier = decider([s], [annonce()], [], UNE_HEURE_APRES);
    expect(premier[0].action).toBe('appliquer');

    // Second passage : le marqueur posé par apply_paid_boost est là.
    const second = decider([s], [annonce({ boostLevel: 'boost_24h', boostExpiresAt: iso(25) })], [s.id], UNE_HEURE_APRES);
    expect(second).toEqual([{ action: 'ignorer', session: s, motif: 'deja_reconcilie' }]);
  });

  it('ne double pas un webhook qui avait finalement fonctionné', () => {
    // Le webhook applique l'expiration a paiement + duree, a quelques secondes pres.
    const annonceHonoree = annonce({ boostLevel: 'boost_24h', boostExpiresAt: iso(24.01) });
    const d = decider([session()], [annonceHonoree], [], UNE_HEURE_APRES);
    expect(d[0]).toMatchObject({ action: 'ignorer', motif: 'deja_honore' });
  });

  it('laisse sa chance au webhook avant de le doubler', () => {
    const d = decider([session({ paidAt: iso(0.9) })], [annonce()], [], UNE_HEURE_APRES);
    expect(d[0]).toMatchObject({ action: 'ignorer', motif: 'trop_recente' });
  });
});

describe('deux achats sur la même annonce', () => {
  const ancien = session({ id: 'cs_ancien', paidAt: iso(0) });
  const recent = session({ id: 'cs_recent', paidAt: iso(30) });
  const options = { maintenant: new Date(T0 + 31 * HEURE) };

  it('rattrape le récent quand seul l\'ancien a été honoré', () => {
    // Expiration en base = celle de l'ancien paiement.
    const a = annonce({ boostLevel: 'boost_24h', boostExpiresAt: iso(24) });
    const d = decider([ancien, recent], [a], [], options);
    expect(d[0]).toMatchObject({ action: 'ignorer', motif: 'deja_honore' });
    expect(d[1]).toMatchObject({ action: 'appliquer', level: 'boost_24h' });
  });

  it('rattrape l\'ancien quand seul le récent a été honoré', () => {
    // Une comparaison « expiration postérieure » ferait passer l'ancien pour honoré.
    const a = annonce({ boostLevel: 'boost_24h', boostExpiresAt: iso(54) });
    const d = decider([ancien, recent], [a], [], options);
    expect(d[0]).toMatchObject({ action: 'appliquer' });
    expect(d[1]).toMatchObject({ action: 'ignorer', motif: 'deja_honore' });
  });
});

describe('ce qui doit alerter plutôt qu\'agir', () => {
  const cas: Array<[string, SessionBoost, AnnonceBoost[], string]> = [
    ['métadonnées absentes', session({ listingId: null }), [annonce()], 'metadonnees_incompletes'],
    ['durée qui ne correspond pas au catalogue', session({ hours: 720 }), [annonce()], 'palier_inconnu'],
    ['palier inventé', session({ level: 'boost_gratuit', hours: 24 }), [annonce()], 'palier_inconnu'],
    ['annonce supprimée', session(), [], 'annonce_introuvable'],
    ['annonce d\'un autre vendeur', session({ userId: AUTRE_VENDEUR }), [annonce()], 'annonce_d_un_autre_vendeur'],
  ];

  for (const [nom, s, annonces, motif] of cas) {
    it(`alerte sur ${nom}`, () => {
      const d = decider([s], annonces, [], UNE_HEURE_APRES);
      expect(d[0]).toMatchObject({ action: 'alerter', motif });
    });
  }

  it('ne raccourcit jamais une mise en avant plus longue en cours', () => {
    // boost_7d en cours : appliquer un boost_24h ramènerait l'expiration en arrière.
    const a = annonce({ boostLevel: 'boost_7d', boostExpiresAt: iso(160) });
    const d = decider([session()], [a], [], UNE_HEURE_APRES);
    expect(d[0]).toMatchObject({ action: 'alerter', motif: 'chevauchement_boost' });
  });
});

describe('contrat avec la base', () => {
  it('construit la clé d\'idempotence exactement comme apply_paid_boost', () => {
    // La migration écrit 'boost-reconcile:' || p_session_id : cette chaîne est le contrat.
    expect(marqueurDe('cs_abc')).toBe('boost-reconcile:cs_abc');
    expect(sessionDuMarqueur('boost-reconcile:cs_abc')).toBe('cs_abc');
    expect(sessionDuMarqueur('evt_stripe_normal')).toBeNull();
  });

  it('ne consulte que les annonces concernées, sans doublon', () => {
    const sessions = [session({ id: 'a' }), session({ id: 'b' }), session({ id: 'c', listingId: null })];
    expect(annoncesAConsulter(sessions)).toEqual([ANNONCE]);
  });
});

describe('lecture de la réponse côté client', () => {
  it('accepte une réponse conforme', () => {
    expect(lireResultatRattrapage({ enabled: true, examined: 3, applied: 1, alerts: 0 }))
      .toEqual({ enabled: true, examined: 3, applied: 1, alerts: 0 });
  });

  it('traite toute réponse douteuse comme « rien fait »', () => {
    expect(lireResultatRattrapage(null)).toBeNull();
    expect(lireResultatRattrapage('ok')).toBeNull();
    expect(lireResultatRattrapage({ examined: 2 })).toBeNull();
    expect(lireResultatRattrapage({ enabled: true, applied: -5 })?.applied).toBe(0);
    expect(lireResultatRattrapage({ enabled: true, applied: 'beaucoup' })?.applied).toBe(0);
  });
});
