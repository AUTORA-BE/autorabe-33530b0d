// Edge function — Création d'annonce sécurisée côté serveur
// Seul point d'entrée pour insérer dans car_listings depuis l'app AutoRA
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildCorsHeaders, handlePreflight, jsonResponse } from '../_shared/cors.ts';

interface ListingPayload {
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
  color: string;
  power?: number | null;
  doors?: number | null;
  euro_norm?: string | null;
  first_registration?: string | null;
  description?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_override?: boolean;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photos?: string[];
  car_pass_url?: string | null;
  car_pass_date?: string | null;
  ct_valid?: boolean;
  maintenance_book_complete?: boolean;
  seller_type?: string;
  tva_number?: string | null;
  features?: string[] | null;
  reference_url?: string | null;
}

// Identité (contact_name/email/phone/seller_type) dérivée serveur depuis le
// profil — ne PAS l'inclure dans REQUIRED côté payload client.
const REQUIRED = ['brand', 'model', 'year', 'price', 'mileage', 'fuel_type', 'transmission', 'body_type', 'color'] as const;

/**
 * Server-side defense in depth: strip control chars + any chevrons / on-* attrs
 * from free-text. React already escapes when rendering, but we don't want
 * `<script>` or `<img onerror>` ever stored at rest.
 */
function sanitizeText(input: unknown, maxLen = 5000): string | null {
  if (input === null || input === undefined) return null;
  const s = String(input)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .slice(0, maxLen)
    .trim();
  return s || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handlePreflight(req);
  void buildCorsHeaders;

  try {
    // 1. Auth — JWT requis
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(req, { error: 'Authentification requise' }, { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse(req, { error: 'Session invalide' }, { status: 401 });
    }

    // 2. Validation payload
    const payload = (await req.json()) as ListingPayload;
    for (const key of REQUIRED) {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        return jsonResponse(req, { error: `Champ obligatoire manquant: ${key}` }, { status: 400 });
      }
    }
    if (typeof payload.year !== 'number' || payload.year < 1900 || payload.year > new Date().getFullYear()) {
      return jsonResponse(req, { error: 'Année invalide' }, { status: 400 });
    }
    if (typeof payload.price !== 'number' || payload.price < 100 || payload.price > 1_000_000) {
      return jsonResponse(req, { error: 'Prix invalide' }, { status: 400 });
    }

    // 3. Vérifier suspension
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: suspended } = await admin.rpc('is_user_suspended', { _user_id: user.id });
    if (suspended) {
      return jsonResponse(req, { error: 'Compte suspendu — publication bloquée' }, { status: 403 });
    }

    // 3b. Rate limit — 10 annonces / jour / user (anti-spam)
    const { data: rlAllowed, error: rlError } = await admin.rpc('check_rate_limit', {
      _key: `listing_create:${user.id}`,
      _max_attempts: 10,
      _window_seconds: 86400,
    });
    if (rlError) {
      console.warn('[create-listing] Rate limit check failed, allowing:', rlError);
    } else if (rlAllowed === false) {
      return jsonResponse(
        req,
        { error: 'Limite de 10 annonces par jour atteinte. Réessayez demain.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': '86400' } },
      );
    }

    // 4. Anti-doublon
    const kmMin = Math.max(0, payload.mileage - 500);
    const kmMax = payload.mileage + 500;
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data: dupes, error: dupeError } = await admin
      .from('car_listings')
      .select('id, mileage, created_at, status')
      .eq('user_id', user.id)
      .ilike('brand', payload.brand)
      .ilike('model', payload.model)
      .eq('year', payload.year)
      .gte('mileage', kmMin)
      .lte('mileage', kmMax)
      .in('status', ['pending', 'approved'])
      .gte('created_at', since)
      .limit(1);

    if (dupeError) {
      console.error('[create-listing] Dupe check error:', dupeError);
    } else if (dupes && dupes.length > 0) {
      return jsonResponse(
        req,
        {
          error: "Une annonce identique existe déjà. Modifiez l'annonce existante plutôt que d'en créer une nouvelle.",
          duplicateId: dupes[0].id,
          code: 'DUPLICATE_LISTING',
        },
        { status: 409 },
      );
    }

    // 4b. Identité du vendeur — TOUJOURS dérivée du profil + auth côté serveur.
    //     Les valeurs envoyées par le client ne sont prises en compte QUE si
    //     `contact_override === true` (l'utilisateur a explicitement ouvert
    //     "Modifier mes coordonnées"). Sinon, un client malveillant pourrait
    //     publier sous l'identité d'un autre.
    const { data: profileRow } = await admin
      .from('profiles')
      .select('display_name, garage_name, phone, user_type')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileName = profileRow?.garage_name || profileRow?.display_name || user.email || 'Vendeur';
    const profileEmail = user.email || '';
    const profilePhone = profileRow?.phone || null;
    const isPro = !!profileRow?.garage_name || profileRow?.user_type === 'professionnel';

    const override = payload.contact_override === true;
    const finalContactName  = (override && payload.contact_name?.trim())  ? payload.contact_name.trim()  : profileName;
    const finalContactEmail = (override && payload.contact_email?.trim()) ? payload.contact_email.trim() : profileEmail;
    const finalContactPhone = (override && payload.contact_phone?.trim()) ? payload.contact_phone.trim() : profilePhone;
    const finalSellerType   = (override && payload.seller_type)           ? payload.seller_type          : (isPro ? 'professionnel' : 'particulier');

    if (!finalContactEmail) {
      return jsonResponse(req, { error: 'Email de contact introuvable — complétez votre profil avant de publier.' }, { status: 400 });
    }

    // 5. Insertion via service_role (seule voie autorisée).
    const { data, error } = await admin
      .from('car_listings')
      .insert({
        user_id: user.id,
        status: 'pending',
        brand: payload.brand,
        model: payload.model,
        year: payload.year,
        price: payload.price,
        mileage: payload.mileage,
        fuel_type: payload.fuel_type,
        transmission: payload.transmission,
        body_type: payload.body_type,
        color: payload.color,
        power: payload.power ?? null,
        doors: payload.doors ?? 5,
        euro_norm: payload.euro_norm ?? null,
        first_registration: payload.first_registration ?? null,
        description: sanitizeText(payload.description, 5000),
        contact_name: finalContactName,
        contact_phone: finalContactPhone,
        contact_email: finalContactEmail,
        location: payload.location ?? null,
        photos: payload.photos ?? [],
        car_pass_verified: !!payload.car_pass_url,
        car_pass_url: payload.car_pass_url ?? null,
        car_pass_date: payload.car_pass_date ?? null,
        ct_valid: payload.ct_valid ?? false,
        maintenance_book_complete: payload.maintenance_book_complete ?? false,
        seller_type: finalSellerType,
        tva_number: payload.tva_number ?? null,
        features: payload.features ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[create-listing] Insert error:', error);
      return jsonResponse(req, { error: 'Internal server error' }, { status: 500 });
    }

    return jsonResponse(req, { id: data.id });
  } catch (e) {
    console.error('[create-listing] Fatal:', e);
    return jsonResponse(req, { error: 'Internal server error' }, { status: 500 });
  }
});
