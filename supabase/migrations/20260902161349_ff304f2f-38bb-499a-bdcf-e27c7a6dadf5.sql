-- =========================================================
-- 1) car_listings : aucun accès direct pour anon
-- =========================================================
REVOKE ALL ON public.car_listings FROM anon;
DROP POLICY IF EXISTS "Public can read approved listings" ON public.car_listings;

GRANT SELECT, UPDATE, DELETE ON public.car_listings TO authenticated;
GRANT ALL ON public.car_listings TO service_role;

-- =========================================================
-- 2) Vue publique assainie, SECURITY DEFINER (invoker = false)
-- =========================================================
DROP VIEW IF EXISTS public.car_listings_public;

CREATE VIEW public.car_listings_public
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  cl.id,
  cl.user_id,
  cl.brand,
  cl.model,
  cl.year,
  cl.price,
  cl.mileage,
  cl.fuel_type,
  cl.transmission,
  cl.body_type,
  cl.color,
  cl.power,
  cl.doors,
  cl.euro_norm,
  cl.car_pass_verified,
  cl.car_pass_status,
  cl.car_pass_date,
  cl.first_registration,
  cl.description,
  cl.features,
  cl.photos,
  cl.location,
  round(cl.latitude::numeric, 2)::double precision  AS latitude,
  round(cl.longitude::numeric, 2)::double precision AS longitude,
  cl.status,
  cl.created_at,
  cl.updated_at,
  cl.ct_valid,
  cl.maintenance_book_complete,
  cl.seller_type,
  cl.boost_level,
  cl.boost_expires_at,
  cl.boost_rank,
  cl.reference_url,
  cl.fuel_consumption,
  cl.co2,
  cl.co2_cycle,
  cl.mma,
  cl.puissance_cv
FROM public.car_listings cl
WHERE cl.status = 'approved';

ALTER VIEW public.car_listings_public OWNER TO postgres;

REVOKE ALL ON public.car_listings_public FROM PUBLIC;
REVOKE ALL ON public.car_listings_public FROM anon;
REVOKE ALL ON public.car_listings_public FROM authenticated;
GRANT SELECT ON public.car_listings_public TO anon, authenticated, service_role;

-- =========================================================
-- 3) listings_within_radius : doit rester utilisable par anon
--    (ne renvoie que id + distance d'annonces approuvées)
-- =========================================================
CREATE OR REPLACE FUNCTION public.listings_within_radius(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision
)
RETURNS TABLE(listing_id uuid, distance_km double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH origin AS (SELECT public.ST_SetSRID(public.ST_MakePoint(user_lng, user_lat), 4326)::public.geography AS g)
  SELECT cl.id, (public.ST_Distance(cl.coordinates, o.g) / 1000.0)::double precision
  FROM public.car_listings cl, origin o
  WHERE cl.status = 'approved' AND cl.coordinates IS NOT NULL
    AND public.ST_DWithin(cl.coordinates, o.g, radius_km * 1000.0)
  ORDER BY cl.coordinates OPERATOR(public.<->) o.g
$function$;

-- =========================================================
-- 4) Fonctions sans search_path figé
-- =========================================================
ALTER FUNCTION public.reject_html_payload() SET search_path TO 'public';
ALTER FUNCTION public.set_listing_coordinates() SET search_path TO 'public';

-- =========================================================
-- 5) Intégrité des messages
-- =========================================================
REVOKE ALL ON public.messages FROM anon;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

CREATE OR REPLACE FUNCTION public.mark_message_read(_message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _updated int;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.messages m
     SET is_read = true
    FROM public.conversations c
   WHERE m.id = _message_id
     AND c.id = m.conversation_id
     AND m.sender_id <> _uid
     AND (c.buyer_id = _uid OR c.seller_id = _uid);

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _updated int;
BEGIN
  IF _uid IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.messages m
     SET is_read = true
    FROM public.conversations c
   WHERE c.id = m.conversation_id
     AND m.conversation_id = _conversation_id
     AND m.sender_id <> _uid
     AND m.is_read IS DISTINCT FROM true
     AND (c.buyer_id = _uid OR c.seller_id = _uid);

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_message_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated, service_role;

-- =========================================================
-- 6) spatial_ref_sys (PostGIS) : lecture seule + RLS si possible
-- =========================================================
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.spatial_ref_sys FROM anon, authenticated;

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
    BEGIN
      EXECUTE 'CREATE POLICY "spatial_ref_sys readable" ON public.spatial_ref_sys FOR SELECT USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  EXCEPTION WHEN insufficient_privilege OR wrong_object_type THEN
    RAISE NOTICE 'spatial_ref_sys: RLS non modifiable (table système PostGIS)';
  END;
END;
$$;