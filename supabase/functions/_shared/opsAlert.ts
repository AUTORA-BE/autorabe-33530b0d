/**
 * Journalisation centralisée des incidents techniques (table public.ops_alerts).
 *
 * Règle stricte : `context` ne doit JAMAIS contenir de données sensibles
 * (email, token, clé API, contenu de message). Uniquement des identifiants
 * techniques, des codes d'erreur et des compteurs.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'

export type OpsSeverity = 'warn' | 'error' | 'critical'

/** Retire les clés potentiellement sensibles du contexte, par sécurité. */
const FORBIDDEN_KEYS = /email|token|key|secret|password|phone|authorization|content/i

function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | null {
  if (!context) return null
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(context)) {
    if (FORBIDDEN_KEYS.test(k)) continue
    if (typeof v === 'string') safe[k] = v.slice(0, 500)
    else if (v === null || ['number', 'boolean'].includes(typeof v)) safe[k] = v
    else safe[k] = String(v).slice(0, 500)
  }
  return safe
}

/**
 * Enregistre un incident. Ne lève jamais : l'observabilité ne doit pas
 * casser le chemin d'exécution qu'elle observe.
 */
export async function logOpsAlert(
  source: string,
  message: string,
  options?: { severity?: OpsSeverity; context?: Record<string, unknown> },
): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) return

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
    await admin.from('ops_alerts').insert({
      source,
      severity: options?.severity ?? 'error',
      message: String(message).slice(0, 2000),
      context: sanitizeContext(options?.context),
    })
  } catch (e) {
    console.error('logOpsAlert failed', { source, error: e instanceof Error ? e.message : String(e) })
  }
}
