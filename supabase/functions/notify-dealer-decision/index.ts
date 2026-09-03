/**
 * Email de décision sur une demande de compte professionnel (validée / refusée).
 * Réservé aux administrateurs ; le destinataire est résolu côté serveur depuis
 * auth.users à partir de l'identifiant utilisateur concerné.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmailLogged } from '../_shared/sendTemplateEmailLogged.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const callerId = userData?.user?.id
  if (userError || !callerId) return json({ error: 'Unauthorized' }, 401)

  const { data: isAdmin, error: roleError } = await admin.rpc('has_role', {
    _user_id: callerId,
    _role: 'admin',
  })
  if (roleError || !isAdmin) return json({ error: 'Forbidden' }, 403)

  let targetUserId: string
  let queueId: string
  let decision: string
  let reason: string | undefined
  let name: string | undefined
  let garageName: string | undefined
  try {
    const body = await req.json()
    targetUserId = String(body?.userId ?? '')
    queueId = String(body?.queueId ?? '')
    decision = String(body?.decision ?? '')
    reason = body?.reason ? String(body.reason).slice(0, 1000) : undefined
    name = body?.name ? String(body.name).slice(0, 200) : undefined
    garageName = body?.garageName ? String(body.garageName).slice(0, 200) : undefined
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  if (!UUID_RE.test(targetUserId)) return json({ error: 'Invalid userId' }, 400)
  if (decision !== 'approved' && decision !== 'rejected') {
    return json({ error: 'Invalid decision' }, 400)
  }

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(targetUserId)
  const recipient = target?.user?.email
  if (targetError || !recipient) return json({ success: false, reason: 'no_recipient' })

  const templateName = decision === 'approved' ? 'dealer-approved' : 'dealer-rejected'
  const result = await sendTemplateEmailLogged(templateName, recipient, {
    idempotencyKey: `dealer-${decision}-${queueId || targetUserId}`,
    templateData:
      decision === 'approved'
        ? { name, garageName }
        : { name, reason },
  })

  return json({ success: result.sent })
})
