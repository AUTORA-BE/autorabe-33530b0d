-- ============================================================
-- Car-Pass async verification — Task 1
-- ----------------------------------------------------------------
-- Goal: nobody can flip `car_pass_verified` themselves.
--   Only an Edge Function (or admin) running with the service role
--   may insert a verification request and mark a listing as verified.
--
-- Schema:
--   car_listings.car_pass_status text  ('unverified'|'pending'|'verified'|'rejected')
--   car_listings.car_pass_request_id text
--   car_listings.car_pass_verified  → recomputed from car_pass_status
--   public.car_pass_verification_requests — audit table
--
-- Visibility:
--   The car_listings_public view continues to surface only approved listings,
--   but we also force car_pass_status = 'verified' OR seller_type = 'professionnel'
--   (pros are pre-vetted).  Pending listings disappear from public search.
-- ============================================================

-- 1. Add new columns
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS car_pass_status     text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS car_pass_request_id text;

-- Backfill for legacy rows that still have car_pass_verified = true
UPDATE public.car_listings
   SET car_pass_status = 'verified'
 WHERE car_pass_verified = true
   AND car_pass_status   = 'unverified';

-- Constraint on the allowed states
ALTER TABLE public.car_listings
  DROP CONSTRAINT IF EXISTS car_pass_status_chk;
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_pass_status_chk
  CHECK (car_pass_status IN ('unverified','pending','verified','rejected'));

-- 2. Replace car_pass_verified with a generated column derived from status
--    (drop view first, recreate after — generated col change requires a re-create
--    and the view depends on it).
DROP VIEW IF EXISTS public.car_listings_public;

ALTER TABLE public.car_listings
  DROP COLUMN IF EXISTS car_pass_verified;

ALTER TABLE public.car_listings
  ADD COLUMN car_pass_verified boolean
    GENERATED ALWAYS AS (car_pass_status = 'verified') STORED;

-- 3. Audit table for verification requests
CREATE TABLE IF NOT EXISTS public.car_pass_verification_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid        NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  requested_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','completed','failed')),
  api_response  jsonb,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_cpvr_listing_id  ON public.car_pass_verification_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_cpvr_status      ON public.car_pass_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_cpvr_requested_at ON public.car_pass_verification_requests(requested_at DESC);

ALTER TABLE public.car_pass_verification_requests ENABLE ROW LEVEL SECURITY;

-- Owners (or admins) can read their own listing's verification trail
DROP POLICY IF EXISTS "Owners can view their own car-pass requests" ON public.car_pass_verification_requests;
CREATE POLICY "Owners can view their own car-pass requests"
  ON public.car_pass_verification_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.car_listings cl
       WHERE cl.id = car_pass_verification_requests.listing_id
         AND cl.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Recreate the public view, hiding non-verified listings except for pros
CREATE VIEW public.car_listings_public
WITH (security_invoker = true)
AS SELECT
    id, brand, model, year, price, mileage, fuel_type, transmission,
    body_type, color, euro_norm, description, features, photos,
    power, doors,
    car_pass_verified, car_pass_status,
    ct_valid, maintenance_book_complete,
    first_registration, location, latitude, longitude,
    seller_type, status, created_at, updated_at,
    boost_level, boost_expires_at,
    reference_url
FROM public.car_listings
WHERE status = 'approved'
  AND (car_pass_status = 'verified' OR seller_type = 'professionnel');

GRANT SELECT ON public.car_listings_public TO anon, authenticated;

-- 5. Trigger: auto-mark the listing as needs_review whenever a sensitive field
--    changes after approval (used by Task 6 below — declared here pre-emptively
--    since we touched the schema). NO-OP if column not yet present.
-- (Implemented in 20260504192000_lock_approved_listings.sql)
