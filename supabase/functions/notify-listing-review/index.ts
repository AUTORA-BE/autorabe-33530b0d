/**
 * Email de décision de modération d'annonce (approuvée / rejetée).
 * Réservé aux administrateurs ; le destinataire est résolu côté serveur
 * depuis l'annonce concernée.
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

  let listingId: string
  let status: string
  let reason: string | undefined
  try {
    const body = await req.json()
    listingId = String(body?.listingId ?? '')
    status = String(body?.status ?? '')
    reason = body?.reason ? String(body.reason).slice(0, 1000) : undefined
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  if (!UUID_RE.test(listingId)) return json({ error: 'Invalid listingId' }, 400)
  if (status !== 'approved' && status !== 'rejected') {
    return json({ error: 'Invalid status' }, 400)
  }

  const { data: listing, error: listingError } = await admin
    .from('car_listings')
    .select('id, contact_email, contact_name, brand, model, year')
    .eq('id', listingId)
    .maybeSingle()

  if (listingError) return json({ error: 'Listing lookup failed' }, 500)
  if (!listing?.contact_email) return json({ success: false, reason: 'no_recipient' })

  const result = await sendTemplateEmailLogged('listing-status', listing.contact_email, {
    idempotencyKey: `listing-status-${listing.id}-${status}`,
    templateData: {
      contactName: listing.contact_name ?? undefined,
      brand: listing.brand ?? undefined,
      model: listing.model ?? undefined,
      year: listing.year ? String(listing.year) : undefined,
      status,
      reason,
    },
  })

  return json({ success: result.sent })
})
