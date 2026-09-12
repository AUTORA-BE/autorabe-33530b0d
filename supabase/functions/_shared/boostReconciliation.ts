/**
 * Réconciliation des mises en avant (boosts) payées mais jamais appliquées.
 *
 * LE TROU QUE CE MODULE COMBLE : un boost n'est activé que par
 * `payments-webhook` (`activateBoost`). Aucune table ne garde trace d'un
 * paiement de boost — ni `create-boost-checkout`, ni la base. Si la livraison
 * du webhook est perdue, le client a payé et le boost n'arrive jamais, sans
 * la moindre alerte : rien, nulle part, ne sait qu'il manque quelque chose.
 *
 * La seule trace existante est donc chez Stripe : les sessions de paiement
 * `mode=payment` réellement réglées. Ce module décide, pour chaque session
 * payée, s'il faut appliquer le boost, l'ignorer, ou alerter — sans rien lire
 * ni écrire lui-même, pour rester testable par vitest.
 *
 * L'application effective est faite par la RPC `public.apply_paid_boost`, qui
 * pose un marqueur unique par session dans `stripe_processed_events` : c'est
 * elle qui garantit « une seule fois », y compris si deux onglets réconcilient
 * en même temps. Ici on évite seulement le travail inutile et les incohérences.
 *
 * La signature et l'idempotence de `payments-webhook` ne sont pas touchées.
 *
 * Aucun import Deno : vitest doit pouvoir charger ce fichier.
 */

import { BOOST_PRICES } from "./catalog.ts";

/** Une session de paiement de boost réglée, telle que Stripe la décrit. */
export interface SessionBoost {
  /** Identifiant de la session Stripe (`cs_…`) — clé d'idempotence. */
  id: string;
  listingId: string | null;
  userId: string | null;
  level: string | null;
  hours: number | null;
  /** Date de règlement, ISO. */
  paidAt: string | null;
}

/** L'annonce visée, telle qu'elle est aujourd'hui en base. */
export interface AnnonceBoost {
  id: string;
  userId: string;
  boostLevel: string | null;
  boostExpiresAt: string | null;
}

export type MotifIgnore = "deja_reconcilie" | "deja_honore" | "trop_recente";

export type MotifAlerte =
  | "metadonnees_incompletes"
  | "palier_inconnu"
  | "annonce_introuvable"
  | "annonce_d_un_autre_vendeur"
  | "chevauchement_boost";

export type Decision =
  | { action: "appliquer"; session: SessionBoost; listingId: string; level: string; hours: number }
  | { action: "ignorer"; session: SessionBoost; motif: MotifIgnore }
  | { action: "alerter"; session: SessionBoost; motif: MotifAlerte };

/**
 * Écart toléré entre l'expiration constatée et celle qu'aurait produite le
 * webhook (`paiement + durée`). Le webhook applique le boost quelques secondes
 * après le paiement ; deux heures absorbent largement une livraison lente.
 */
export const TOLERANCE_WEBHOOK_HEURES = 2;

/**
 * Délai laissé au webhook avant de considérer qu'il est perdu. En dessous, la
 * livraison peut être simplement en cours ou en cours de nouvelle tentative.
 */
export const DELAI_GRACE_MINUTES = 10;

const HEURE_MS = 3_600_000;
const MINUTE_MS = 60_000;

const dateValide = (iso: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * Le boost de cette session a-t-il déjà été appliqué par le webhook ?
 *
 * Comparaison symétrique : l'expiration en base doit tomber, à la tolérance
 * près, sur `paiement + durée`. Un simple « expiration postérieure » ferait
 * passer pour honorée une session ancienne qu'un boost plus récent recouvre.
 */
export function dejaHonore(
  session: SessionBoost,
  annonce: AnnonceBoost,
  toleranceHeures: number = TOLERANCE_WEBHOOK_HEURES,
): boolean {
  const paidAt = dateValide(session.paidAt);
  const expiresAt = dateValide(annonce.boostExpiresAt);
  if (paidAt === null || expiresAt === null || !session.hours) return false;
  if (annonce.boostLevel !== session.level) return false;
  const attendu = paidAt + session.hours * HEURE_MS;
  return Math.abs(expiresAt - attendu) <= toleranceHeures * HEURE_MS;
}

export interface OptionsDecision {
  maintenant?: Date;
  toleranceHeures?: number;
  delaiGraceMinutes?: number;
}

/**
 * Que faire de chaque session payée.
 *
 * `sessionsDejaReconciliees` contient les identifiants de session déjà portés
 * par un marqueur `boost-reconcile:<id>` dans `stripe_processed_events`.
 */
export function decider(
  sessions: SessionBoost[],
  annonces: AnnonceBoost[],
  sessionsDejaReconciliees: Iterable<string>,
  options: OptionsDecision = {},
): Decision[] {
  const deja = new Set(sessionsDejaReconciliees);
  const parId = new Map(annonces.map((a) => [a.id, a]));
  const maintenant = (options.maintenant ?? new Date()).getTime();
  const tolerance = options.toleranceHeures ?? TOLERANCE_WEBHOOK_HEURES;
  const grace = (options.delaiGraceMinutes ?? DELAI_GRACE_MINUTES) * MINUTE_MS;

  return sessions.map((session): Decision => {
    if (deja.has(session.id)) {
      return { action: "ignorer", session, motif: "deja_reconcilie" };
    }

    const { listingId, level, hours } = session;
    const paidAt = dateValide(session.paidAt);
    if (!listingId || !level || !hours || hours <= 0 || paidAt === null) {
      return { action: "alerter", session, motif: "metadonnees_incompletes" };
    }

    // Le webhook a peut-être simplement du retard : on ne le double pas trop tôt.
    if (paidAt > maintenant - grace) {
      return { action: "ignorer", session, motif: "trop_recente" };
    }

    // Le palier doit exister au catalogue serveur ET annoncer la même durée :
    // les métadonnées viennent de Stripe, elles ne font pas autorité sur le prix.
    if (BOOST_PRICES[level]?.hours !== hours) {
      return { action: "alerter", session, motif: "palier_inconnu" };
    }

    const annonce = parId.get(listingId);
    if (!annonce) {
      return { action: "alerter", session, motif: "annonce_introuvable" };
    }
    if (session.userId && annonce.userId !== session.userId) {
      return { action: "alerter", session, motif: "annonce_d_un_autre_vendeur" };
    }

    if (dejaHonore(session, annonce, tolerance)) {
      return { action: "ignorer", session, motif: "deja_honore" };
    }

    // Appliquer écraserait une mise en avant en cours qui se termine plus tard :
    // on ne raccourcit jamais un boost payé en silence, on fait remonter le cas.
    const expiresAt = dateValide(annonce.boostExpiresAt);
    if (expiresAt !== null && expiresAt > maintenant + hours * HEURE_MS) {
      return { action: "alerter", session, motif: "chevauchement_boost" };
    }

    return { action: "appliquer", session, listingId, level, hours };
  });
}

/** Identifiants d'annonce à charger pour décider — évite de lire toute la table. */
export function annoncesAConsulter(sessions: SessionBoost[]): string[] {
  return [...new Set(sessions.map((s) => s.listingId).filter((id): id is string => Boolean(id)))];
}

/** Clé du marqueur d'idempotence, identique à celle posée par `apply_paid_boost`. */
export const marqueurDe = (sessionId: string) => `boost-reconcile:${sessionId}`;

/** Extrait l'identifiant de session d'un marqueur ; null si ce n'en est pas un. */
export function sessionDuMarqueur(eventId: string): string | null {
  const prefixe = marqueurDe("");
  return eventId.startsWith(prefixe) ? eventId.slice(prefixe.length) : null;
}
