
-- 1. CHECK constraint to prevent javascript:/data: URIs in car_pass_url (XSS hardening)
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_pass_url_https_only
  CHECK (car_pass_url IS NULL OR car_pass_url ~* '^https://');

-- 2. Trigger preventing non-admin sellers from changing the status column
CREATE OR REPLACE FUNCTION public.prevent_status_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only administrators can change listing status'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS car_listings_prevent_status_self_change ON public.car_listings;
CREATE TRIGGER car_listings_prevent_status_self_change
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_status_self_change();

-- 3. Revoke column-level SELECT on contact fields from anon and authenticated.
-- Owners and admins continue to access these via SECURITY DEFINER RPCs below.
REVOKE SELECT (contact_email, contact_phone, contact_name) ON public.car_listings FROM anon;
REVOKE SELECT (contact_email, contact_phone, contact_name) ON public.car_listings FROM authenticated;

-- Re-grant SELECT on all OTHER columns to anon/authenticated (RLS still applies)
GRANT SELECT (
  id, user_id, brand, model, year, price, mileage, fuel_type, transmission,
  body_type, color, ct_valid, status, location, photos, features, description,
  first_registration, car_pass_verified, euro_norm, doors, power, car_pass_date,
  car_pass_url, search_vector, boost_warning_sent, boost_expires_at, boost_level,
  tva_number, seller_type, maintenance_book_complete, created_at, updated_at
) ON public.car_listings TO anon, authenticated;

-- 4. Admin RPC to list car listings with contact info (replaces direct SELECT in admin pages)
CREATE OR REPLACE FUNCTION public.admin_list_listings_with_contacts(_limit integer DEFAULT 500)
RETURNS TABLE (
  id uuid, user_id uuid, brand text, model text, year integer, price integer,
  mileage integer, fuel_type text, transmission text, location text,
  photos text[], contact_name text, contact_email text, contact_phone text,
  created_at timestamptz, status text, seller_type text, description text,
  euro_norm text, boost_level text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cl.id, cl.user_id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
         cl.fuel_type, cl.transmission, cl.location, cl.photos,
         cl.contact_name, cl.contact_email, cl.contact_phone,
         cl.created_at, cl.status, cl.seller_type, cl.description,
         cl.euro_norm, cl.boost_level
  FROM public.car_listings cl
  ORDER BY cl.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 5000));
END;
$$;

-- 5. Admin RPC to fetch contact info for a set of listing IDs
CREATE OR REPLACE FUNCTION public.admin_get_listing_contacts(_ids uuid[])
RETURNS TABLE (
  id uuid, contact_name text, contact_email text, contact_phone text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cl.id, cl.contact_name, cl.contact_email, cl.contact_phone
  FROM public.car_listings cl
  WHERE cl.id = ANY(_ids);
END;
$$;
