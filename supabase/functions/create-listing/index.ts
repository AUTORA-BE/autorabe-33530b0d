// Edge function — Création d'annonce sécurisée côté serveur
// Seul point d'entrée pour insérer dans car_listings depuis l'app AutoRa
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  contact_name: string;
  contact_phone?: string | null;
  contact_email: string;
  location?: string | null;
  photos?: string[];
  car_pass_verified?: boolean;
  car_pass_url?: string | null;
  car_pass_date?: string | null;
  ct_valid?: boolean;
  maintenance_book_complete?: boolean;
  seller_type?: string;
  tva_number?: string | null;
}

const REQUIRED = ['brand', 'model', 'year', 'price', 'mileage', 'fuel_type', 'transmission', 'body_type', 'color', 'contact_name', 'contact_email'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // 1. Auth — JWT requis
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentification requise' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validation payload
    const payload = (await req.json()) as ListingPayload;
    for (const key of REQUIRED) {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        return new Response(JSON.stringify({ error: `Champ obligatoire manquant: ${key}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    if (typeof payload.year !== 'number' || payload.year < 1900 || payload.year > new Date().getFullYear()) {
      return new Response(JSON.stringify({ error: 'Année invalide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (typeof payload.price !== 'number' || payload.price < 100 || payload.price > 1_000_000) {
      return new Response(JSON.stringify({ error: 'Prix invalide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Vérifier suspension
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: suspended } = await admin.rpc('is_user_suspended', { _user_id: user.id });
    if (suspended) {
      return new Response(JSON.stringify({ error: 'Compte suspendu — publication bloquée' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Anti-doublon — même user, même voiture (marque/modèle/année, km ±500),
    //    annonce active (pending ou approved) dans les 90 derniers jours
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
      return new Response(
        JSON.stringify({
          error: 'Une annonce identique existe déjà (même marque, modèle, année et kilométrage). Modifiez l\'annonce existante plutôt que d\'en créer une nouvelle.',
          duplicateId: dupes[0].id,
          code: 'DUPLICATE_LISTING',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 5. Insertion via service_role (seule voie autorisée)
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
        description: payload.description ?? null,
        contact_name: payload.contact_name,
        contact_phone: payload.contact_phone ?? null,
        contact_email: payload.contact_email,
        location: payload.location ?? null,
        photos: payload.photos ?? [],
        car_pass_verified: payload.car_pass_verified ?? false,
        car_pass_url: payload.car_pass_url ?? null,
        car_pass_date: payload.car_pass_date ?? null,
        ct_valid: payload.ct_valid ?? false,
        maintenance_book_complete: payload.maintenance_book_complete ?? false,
        seller_type: payload.seller_type ?? 'particulier',
        tva_number: payload.tva_number ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[create-listing] Insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[create-listing] Fatal:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
