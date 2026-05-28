-- ============================================================
-- Listing integrity constraints — server-side guardrails
-- ------------------------------------------------------------
-- Zod validates the form client-side, but a partner garage importing
-- stock via the API (or a crafted request) could bypass the UI. These
-- CHECK constraints make absurd values impossible at the database level.
--
-- `price`, `year`, `mileage` are already INTEGER NOT NULL (so "missing
-- price" is impossible) — we add range bounds here.
--
-- Added as NOT VALID first, then VALIDATEd, so the migration never fails
-- on a large existing table and only locks briefly.
-- ============================================================

-- Mileage : 0 .. 999 999 km
ALTER TABLE public.car_listings DROP CONSTRAINT IF EXISTS car_listings_mileage_chk;
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_listings_mileage_chk
  CHECK (mileage >= 0 AND mileage <= 999999) NOT VALID;
ALTER TABLE public.car_listings VALIDATE CONSTRAINT car_listings_mileage_chk;

-- Price : 100 .. 1 000 000 €
ALTER TABLE public.car_listings DROP CONSTRAINT IF EXISTS car_listings_price_chk;
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_listings_price_chk
  CHECK (price >= 100 AND price <= 1000000) NOT VALID;
ALTER TABLE public.car_listings VALIDATE CONSTRAINT car_listings_price_chk;

-- Year : 1900 .. (current year + 1, for upcoming model years)
ALTER TABLE public.car_listings DROP CONSTRAINT IF EXISTS car_listings_year_chk;
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_listings_year_chk
  CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM now())::int + 1) NOT VALID;
ALTER TABLE public.car_listings VALIDATE CONSTRAINT car_listings_year_chk;
