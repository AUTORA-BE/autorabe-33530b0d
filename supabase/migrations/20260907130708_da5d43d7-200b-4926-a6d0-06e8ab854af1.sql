-- Align car_listings_status_check with the constraint actually in production.
-- Production accepts 7 values, but 20260516100000_archived_status.sql declared
-- only 5 ('draft' and 'pending_review' were missing). The trigger
-- guard_sensitive_listing_updates writes 'pending_review' on listing edits, so a
-- database rebuilt from the repository would reject listing edits.
-- Idempotent, touches no rows.

ALTER TABLE public.car_listings
  DROP CONSTRAINT IF EXISTS car_listings_status_check;

ALTER TABLE public.car_listings
  ADD CONSTRAINT car_listings_status_check
  CHECK (status = ANY (ARRAY[
    'draft'::text,
    'pending'::text,
    'pending_review'::text,
    'approved'::text,
    'sold'::text,
    'rejected'::text,
    'archived'::text
  ]));

COMMENT ON COLUMN public.car_listings.status IS
  'draft | pending | pending_review | approved | sold | rejected | archived (soft-deleted, invisible to buyers)';