/**
 * Fréquences d'alerte : ce qui est stocké, et ce qui est réellement envoyé.
 * @module features/alerts/constants
 *
 * `supabase/functions/match-new-vehicle/index.ts` ne lit que les alertes
 * `frequency = 'instant'` (`.eq("frequency", "instant")`), et aucun cron de
 * digest n'existe dans la base : proposer « quotidien » ou « hebdomadaire »
 * dans l'UI promettrait des emails que rien n'envoie jamais.
 *
 * Pour rouvrir ces options : livrer d'abord le digest (edge function + cron
 * pg_cron), et seulement ensuite ajouter la valeur à
 * `DELIVERED_ALERT_FREQUENCIES` puis à `ALERT_FREQUENCY_OPTIONS`.
 */

/** Valeurs acceptées par la colonne `user_alerts.frequency`. */
export const ALERT_FREQUENCIES = ["instant", "daily", "weekly"] as const;

export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

/** Fréquences qui déclenchent réellement un envoi aujourd'hui. */
export const DELIVERED_ALERT_FREQUENCIES = ["instant"] as const;

export type DeliveredAlertFrequency = (typeof DELIVERED_ALERT_FREQUENCIES)[number];

/** Fréquence appliquée par défaut à toute nouvelle alerte. */
export const DEFAULT_ALERT_FREQUENCY: DeliveredAlertFrequency = "instant";

/** Une option proposée dans le formulaire de création d'alerte. */
export interface AlertFrequencyOption {
  value: AlertFrequency;
  title: string;
  desc: string;
}

/**
 * Options affichées à l'utilisateur.
 *
 * INVARIANT (vérifié par alertFrequency.test.ts) : chaque `value` doit figurer
 * dans `DELIVERED_ALERT_FREQUENCIES`. L'UI ne propose que ce que le serveur
 * sait faire.
 */
export const ALERT_FREQUENCY_OPTIONS: readonly AlertFrequencyOption[] = [
  {
    value: "instant",
    title: "Instantané",
    desc: "Dès qu'une annonce correspond à vos critères",
  },
];

/** `true` si cette fréquence déclenche réellement un envoi. */
export function isDeliveredAlertFrequency(
  value: string,
): value is DeliveredAlertFrequency {
  return (DELIVERED_ALERT_FREQUENCIES as readonly string[]).includes(value);
}
