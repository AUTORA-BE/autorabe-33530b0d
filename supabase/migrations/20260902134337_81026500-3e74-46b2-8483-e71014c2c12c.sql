ALTER TABLE public.dealer_kyc
  ADD COLUMN IF NOT EXISTS bce_number text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS address    text;

ALTER TABLE public.dealer_kyc DROP CONSTRAINT IF EXISTS dealer_kyc_vat_chk;
ALTER TABLE public.dealer_kyc ADD CONSTRAINT dealer_kyc_vat_chk
  CHECK (vat_number IS NULL OR vat_number ~ '^BE0[0-9]{9}$');