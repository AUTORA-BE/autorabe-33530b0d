-- ============================================================
-- Task 6 — Lock approved listings
-- ----------------------------------------------------------------
-- Once a listing is `approved`, the seller may freely edit only
-- low-risk fields (description, photos, features, contact_phone).
-- Any change to a *sensitive* field (price, mileage, brand, model,
-- year, fuel_type, body_type, euro_norm, location, latitude,
-- longitude, car_pass_status) flips the listing back to
-- status='pending_review' AND sets needs_review=true so an admin
-- has to look at it again.
--
-- Admins (has_role 'admin') bypass the trigger via SET LOCAL.
-- ============================================================

ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_sensitive_listing_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  changed  boolean := false;
BEGIN
  -- Only act on UPDATEs of approved rows
  IF TG_OP <> 'UPDATE' OR OLD.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Admins always pass through
  BEGIN
    is_admin := public.has_role(auth.uid(), 'admin');
  EXCEPTION WHEN OTHERS THEN
    is_admin := false;
  END;
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Detect sensitive-field deltas
  IF
    NEW.brand            IS DISTINCT FROM OLD.brand            OR
    NEW.model            IS DISTINCT FROM OLD.model            OR
    NEW.year             IS DISTINCT FROM OLD.year             OR
    NEW.price            IS DISTINCT FROM OLD.price            OR
    NEW.mileage          IS DISTINCT FROM OLD.mileage          OR
    NEW.fuel_type        IS DISTINCT FROM OLD.fuel_type        OR
    NEW.body_type        IS DISTINCT FROM OLD.body_type        OR
    NEW.euro_norm        IS DISTINCT FROM OLD.euro_norm        OR
    NEW.car_pass_status  IS DISTINCT FROM OLD.car_pass_status  OR
    NEW.location         IS DISTINCT FROM OLD.location         OR
    NEW.latitude         IS DISTINCT FROM OLD.latitude         OR
    NEW.longitude        IS DISTINCT FROM OLD.longitude
  THEN
    changed := true;
  END IF;

  IF changed THEN
    -- Force re-review.  Carry over the rest of the user's edit so they
    -- don't lose their work, but the public can no longer see this row
    -- until an admin re-approves it.
    NEW.status       := 'pending_review';
    NEW.needs_review := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS car_listings_lock_approved ON public.car_listings;
CREATE TRIGGER car_listings_lock_approved
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_sensitive_listing_updates();

-- Index used by the admin moderation page to surface listings flagged
-- by the trigger.
CREATE INDEX IF NOT EXISTS idx_car_listings_needs_review
  ON public.car_listings (needs_review)
  WHERE needs_review = true;
