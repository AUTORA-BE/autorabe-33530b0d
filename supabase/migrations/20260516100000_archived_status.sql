-- Soft-delete support: add 'archived' status to car_listings.
-- Sellers who "delete" a listing get status='archived' instead of a hard DELETE.
-- Archived listings remain visible to the seller (in their dashboard) and to admins,
-- but are hidden from public buyers (RLS only exposes status='approved' to anon/public).

ALTER TABLE public.car_listings
  DROP CONSTRAINT IF EXISTS car_listings_status_check;

ALTER TABLE public.car_listings
  ADD CONSTRAINT car_listings_status_check
  CHECK (status IN ('pending', 'approved', 'sold', 'rejected', 'archived'));

COMMENT ON COLUMN public.car_listings.status IS
  'pending | approved | sold | rejected | archived (soft-deleted, invisible to buyers)';
