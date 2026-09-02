/**
 * Cron horaire : envoie un unique email récapitulatif des incidents
 * `ops_alerts` non encore notifiés, puis les marque comme notifiés.
 * Réutilise l'infrastructure email existante (send-transactional-email).
 */
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  // Interne uniquement (cron / service_role).
  const callerToken = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!serviceKey || callerToken !== serviceKey) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data: alerts, error } = await admin
    .from('ops_alerts')
    .select('id, source, severity, message, created_at')
    .is('notified_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('ops-alerts-digest: read failed', error.message)
    return json({ error: 'read_failed' }, 500)
  }

  if (!alerts || alerts.length === 0) {
    return json({ sent: false, pending: 0 })
  }

  const critical = alerts.filter((a) => a.severity === 'critical').length

  const { error: sendError } = await admin.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'ops-alert-digest',
      templateData: {
        total: alerts.length,
        critical,
        alerts: alerts.slice(0, 20).map((a) => ({
          source: a.source,
          severity: a.severity,
          message: a.message,
          created_at: new Date(a.created_at as string).toISOString().replace('T', ' ').slice(0, 16),
        })),
      },
    },
  })

  if (sendError) {
    console.error('ops-alerts-digest: send failed', sendError.message)
    return json({ error: 'send_failed' }, 500)
  }

  const { error: markError } = await admin
    .from('ops_alerts')
    .update({ notified_at: new Date().toISOString() })
    .in('id', alerts.map((a) => a.id))

  if (markError) {
    console.error('ops-alerts-digest: mark failed', markError.message)
    return json({ sent: true, marked: false }, 500)
  }

  return json({ sent: true, count: alerts.length, critical })
})
