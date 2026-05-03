-- 1) Retirer la policy qui expose contact_email/phone aux acheteurs en conversation
DROP POLICY IF EXISTS "Buyers in conversation can view full listing" ON public.car_listings;

-- Remplacer par une RPC sûre pour les acheteurs en conversation: pas de contact direct
CREATE OR REPLACE FUNCTION public.get_listing_for_buyer(_listing_id uuid)
RETURNS TABLE(
  id uuid, user_id uuid, brand text, model text, year integer, price integer, mileage integer,
  fuel_type text, transmission text, body_type text, color text, power integer, doors integer,
  euro_norm text, car_pass_verified boolean, first_registration date, description text,
  features text[], photos text[], location text, status text, created_at timestamptz,
  updated_at timestamptz, ct_valid boolean, maintenance_book_complete boolean, seller_type text,
  tva_number text, boost_level text, boost_expires_at timestamptz, car_pass_url text, car_pass_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cl.id, cl.user_id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.body_type, cl.color, cl.power, cl.doors,
    cl.euro_norm, cl.car_pass_verified, cl.first_registration, cl.description,
    cl.features, cl.photos, cl.location, cl.status, cl.created_at, cl.updated_at,
    cl.ct_valid, cl.maintenance_book_complete, cl.seller_type, cl.tva_number,
    cl.boost_level, cl.boost_expires_at, cl.car_pass_url, cl.car_pass_date
  FROM public.car_listings cl
  WHERE cl.id = _listing_id
    AND auth.uid() IS NOT NULL
    AND public.has_conversation_with_listing(cl.id, auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_listing_for_buyer(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_listing_for_buyer(uuid) TO authenticated;

-- 2) alert_notifications: bloquer toute insert/delete client (réservé service_role)
CREATE POLICY "Service role only insert alert notifications"
ON public.alert_notifications FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only delete alert notifications"
ON public.alert_notifications FOR DELETE
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Users can mark their alert notifications opened/clicked"
ON public.alert_notifications FOR UPDATE
TO authenticated
USING (alert_id IN (SELECT id FROM public.user_alerts WHERE user_id = auth.uid()))
WITH CHECK (alert_id IN (SELECT id FROM public.user_alerts WHERE user_id = auth.uid()));