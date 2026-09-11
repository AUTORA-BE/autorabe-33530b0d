/**
 * Plafond quotidien de messages — lecture pour l'affichage uniquement.
 *
 * Le plafond est APPLIQUE cote serveur : le trigger
 * `trg_enforce_daily_message_limit` sur `public.messages` compte et refuse
 * l'INSERT au-dela du plafond, dans la transaction de l'envoi. Ce hook ne
 * decide rien : il lit `get_daily_message_quota()`, seule source de verite
 * (aucun palier n'est recalcule ici, aucun compteur n'est ecrit ici).
 *
 * Consequence voulue : si le quota n'est pas encore connu, l'UI n'interdit
 * rien. Un faux blocage cote client serait un mensonge de plus ; le refus
 * vient du serveur ou ne vient pas.
 * @module features/messaging/hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

/** Cle de cache du quota du jour. */
export const MESSAGE_QUOTA_KEY = ['daily-message-quota'];

/** Message leve par le trigger serveur quand le plafond du jour est atteint. */
export const DAILY_MESSAGE_LIMIT_ERROR = 'DAILY_MESSAGE_LIMIT_REACHED';

/** SQLSTATE renvoye par le trigger (PostgREST le traduit en HTTP 429). */
export const DAILY_MESSAGE_LIMIT_CODE = 'PT429';

/** Ligne renvoyee par le RPC `get_daily_message_quota`. */
export interface MessageQuotaRow {
  limit_per_day: number | null;
  used: number | null;
  remaining: number | null;
}

export interface MessageQuota {
  /** Plafond quotidien, `null` = illimite (pro, premium, admin). */
  limit: number | null;
  /** Messages deja envoyes aujourd'hui. */
  used: number;
  /** Messages restants, `null` = illimite. */
  remaining: number | null;
  /** `false` uniquement quand le plafond est connu ET atteint. */
  canSendMessage: boolean;
  /** Quota connu (le serveur a repondu). */
  isKnown: boolean;
}

/** Quota inconnu : aucun blocage cote client, le serveur reste l'arbitre. */
export const UNKNOWN_QUOTA: MessageQuota = {
  limit: null,
  used: 0,
  remaining: null,
  canSendMessage: true,
  isKnown: false,
};

/**
 * Traduit une ligne du RPC en etat d'affichage.
 * `limit` a `null` signifie illimite : jamais de blocage.
 */
export function deriveQuota(row: MessageQuotaRow | null | undefined): MessageQuota {
  if (!row || row.limit_per_day === null || row.limit_per_day === undefined) {
    return { ...UNKNOWN_QUOTA, isKnown: !!row, used: row?.used ?? 0 };
  }

  const limit = row.limit_per_day;
  const used = row.used ?? 0;
  const remaining = row.remaining ?? Math.max(0, limit - used);

  return {
    limit,
    used,
    remaining,
    canSendMessage: remaining > 0,
    isKnown: true,
  };
}

/**
 * Reconnait le refus du plafond quotidien dans une erreur Supabase.
 * On teste le SQLSTATE **et** le message : selon la version de PostgREST,
 * `code` peut remonter le SQLSTATE brut ou un code HTTP.
 */
export function isDailyLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, message, details } = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  if (code === DAILY_MESSAGE_LIMIT_CODE || code === '429') return true;
  return [message, details].some(
    (field) => typeof field === 'string' && field.includes(DAILY_MESSAGE_LIMIT_ERROR)
  );
}

/**
 * Etat du plafond quotidien de l'utilisateur courant, pour l'affichage.
 * L'envoi reste refuse par le serveur, pas par ce hook.
 */
export function useMessageLimit(): MessageQuota & { isLoading: boolean } {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: [...MESSAGE_QUOTA_KEY, user?.id],
    queryFn: async (): Promise<MessageQuota> => {
      const { data, error } = await supabase.rpc('get_daily_message_quota');
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as MessageQuotaRow | undefined;
      return deriveQuota(row);
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  return { ...(data ?? UNKNOWN_QUOTA), isLoading };
}
