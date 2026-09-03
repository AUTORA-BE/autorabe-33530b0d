/**
 * Emails d'inscription : email de bienvenue à l'utilisateur et, pour un compte
 * professionnel, alerte interne « nouvelle demande pro ».
 *
 * Le destinataire est TOUJOURS dérivé côté serveur depuis auth.users :
 * le client ne transmet qu'un identifiant utilisateur.
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
const MAX_ACCOUNT_AGE_MS = 15 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let userId: string
  try {
    const body = await req.json()
    userId = String(body?.userId ?? '')
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  if (!UUID_RE.test(userId)) return json({ error: 'Invalid userId' }, 400)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
  const user = userData?.user
  if (userError || !user?.email) return json({ error: 'User not found' }, 404)

  // Ne s'applique qu'aux comptes fraîchement créés (anti-abus).
  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
  if (!createdAt || Date.now() - createdAt > MAX_ACCOUNT_AGE_MS) {
    return json({ error: 'Account is not eligible' }, 403)
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, garage_name, bce_number, phone, postal_code, seller_type')
    .eq('user_id', userId)
    .maybeSingle()

  const isPro = profile?.seller_type === 'professional' || Boolean(profile?.garage_name)

  if (isPro) {
    // Alerte interne (destinataire fixe défini par le template)
    await sendTemplateEmailLogged('new-dealer-signup', 'autoracontact@gmail.com', {
      idempotencyKey: `dealer-signup-${userId}`,
      templateData: {
        fullName: profile?.display_name ?? undefined,
        email: user.email,
        phone: profile?.phone ?? undefined,
        garageName: profile?.garage_name ?? undefined,
        bceNumber: profile?.bce_number ?? undefined,
        postalCode: profile?.postal_code ?? undefined,
      },
    })
  }

  await sendTemplateEmailLogged('welcome', user.email, {
    idempotencyKey: `welcome-${userId}`,
    templateData: { name: profile?.display_name ?? undefined },
  })

  return json({ success: true })
})
