-- Bloque les insertions directes sur car_listings
-- Seule l'edge function create-listing (service_role) pourra insérer désormais
DROP POLICY IF EXISTS "Users can create their own listings" ON public.car_listings;