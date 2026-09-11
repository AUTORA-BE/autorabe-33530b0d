/**
 * Plafond quotidien de messages — semantique d'affichage.
 *
 * Ces tests figent deux regles qui n'existaient pas quand le hook etait mort :
 *  1. un quota inconnu ne bloque JAMAIS l'envoi (le serveur est l'arbitre) ;
 *  2. le refus du serveur est reconnu de facon fiable, pour ne pas l'afficher
 *     comme une erreur technique.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveQuota,
  isDailyLimitError,
  DAILY_MESSAGE_LIMIT_ERROR,
  DAILY_MESSAGE_LIMIT_CODE,
} from './useMessageLimit';
import {
  FREE_MESSAGE_LIMIT,
  SUBSCRIPTION_TIERS,
} from '@/features/subscription/constants/tiers';

describe('deriveQuota', () => {
  it('gratuit : 5/jour, 2 envoyes -> 3 restants, envoi autorise', () => {
    expect(deriveQuota({ limit_per_day: 5, used: 2, remaining: 3 })).toEqual({
      limit: 5,
      used: 2,
      remaining: 3,
      canSendMessage: true,
      isKnown: true,
    });
  });

  it('plafond atteint -> envoi refuse', () => {
    const quota = deriveQuota({ limit_per_day: 5, used: 5, remaining: 0 });
    expect(quota.canSendMessage).toBe(false);
    expect(quota.remaining).toBe(0);
  });

  it('illimite (pro, premium, admin) -> aucun plafond affiche', () => {
    const quota = deriveQuota({ limit_per_day: null, used: 120, remaining: null });
    expect(quota.limit).toBeNull();
    expect(quota.remaining).toBeNull();
    expect(quota.canSendMessage).toBe(true);
  });

  it('quota inconnu (pas de reponse) -> envoi autorise, marque non connu', () => {
    expect(deriveQuota(undefined).canSendMessage).toBe(true);
    expect(deriveQuota(undefined).isKnown).toBe(false);
    expect(deriveQuota(null).canSendMessage).toBe(true);
  });

  it('remaining absent -> recalcule depuis limite et usage', () => {
    expect(deriveQuota({ limit_per_day: 5, used: 4, remaining: null }).remaining).toBe(1);
    expect(deriveQuota({ limit_per_day: 5, used: 9, remaining: null }).remaining).toBe(0);
  });

  it('usage superieur au plafond -> restant plancher a 0, jamais negatif', () => {
    const quota = deriveQuota({ limit_per_day: 5, used: 8, remaining: null });
    expect(quota.remaining).toBe(0);
    expect(quota.canSendMessage).toBe(false);
  });
});

describe('isDailyLimitError', () => {
  it('reconnait le SQLSTATE du trigger', () => {
    expect(isDailyLimitError({ code: DAILY_MESSAGE_LIMIT_CODE })).toBe(true);
  });

  it('reconnait le code HTTP 429 remonte par PostgREST', () => {
    expect(isDailyLimitError({ code: '429' })).toBe(true);
  });

  it('reconnait le message du trigger', () => {
    expect(
      isDailyLimitError({ code: 'P0001', message: DAILY_MESSAGE_LIMIT_ERROR })
    ).toBe(true);
  });

  it('reconnait le message place dans details', () => {
    expect(
      isDailyLimitError({ code: 'P0001', details: `... ${DAILY_MESSAGE_LIMIT_ERROR} ...` })
    ).toBe(true);
  });

  it('ne confond pas une autre erreur avec le plafond', () => {
    expect(isDailyLimitError({ code: '42501', message: 'new row violates RLS' })).toBe(false);
    expect(isDailyLimitError(new Error('network'))).toBe(false);
    expect(isDailyLimitError(null)).toBe(false);
    expect(isDailyLimitError('PT429')).toBe(false);
  });
});

/**
 * Garde-fou anti-derive : la fonction SQL `public.daily_message_limit`
 * (migration 20260911234225) recopie ces valeurs. Si un palier change ici
 * sans que la migration suive, l'UI et le serveur ne diront plus la meme
 * chose — ce test tombe pour forcer la mise a jour des deux cotes.
 */
describe('contrat avec la fonction SQL daily_message_limit', () => {
  it('les plafonds applicatifs sont ceux recopies dans la migration', () => {
    expect(FREE_MESSAGE_LIMIT).toBe(5);
    expect(SUBSCRIPTION_TIERS.particulier.messageLimitPerDay).toBe(100);
    expect(SUBSCRIPTION_TIERS.pro.messageLimitPerDay).toBeNull();
    expect(SUBSCRIPTION_TIERS.premium.messageLimitPerDay).toBeNull();
  });

  it('les identifiants produit herites resolus par la migration sont inchanges', () => {
    expect(SUBSCRIPTION_TIERS.particulier.product_id).toBe('prod_VBzrk30V0HDldQ');
    expect(SUBSCRIPTION_TIERS.pro.product_id).toBe('prod_UKno1VUDM4yfzP');
    expect(SUBSCRIPTION_TIERS.premium.product_id).toBe('prod_UKo0UuUbuB5vdq');
  });
});
