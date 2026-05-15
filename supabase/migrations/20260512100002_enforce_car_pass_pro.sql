-- C2: Defense-in-depth — block listings by professional sellers without a Car-Pass document.
-- Belgian law (Loi du 11 juin 2004 sur la fraude au compteur) requires the Car-Pass
-- to be provided by professional sellers of used vehicles.
--
-- This trigger fires BEFORE INSERT and BEFORE UPDATE to ensure the rule cannot be
-- bypassed via direct API calls or admin tooling.

CREATE OR REPLACE FUNCTION public.enforce_pro_car_pass()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for active/visible listings
  IF NEW.seller_type = 'professionnel' AND COALESCE(NEW.status, 'active') <> 'draft' THEN
    IF NEW.car_pass_url IS NULL OR length(trim(NEW.car_pass_url)) = 0 THEN
      RAISE EXCEPTION 'car_pass_required_for_professional'
        USING ERRCODE = 'P0001',
              HINT = 'Les vendeurs professionnels doivent fournir un document Car-Pass.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pro_car_pass ON public.car_listings;

CREATE TRIGGER trg_enforce_pro_car_pass
  BEFORE INSERT OR UPDATE OF seller_type, car_pass_url, status ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pro_car_pass();

COMMENT ON FUNCTION public.enforce_pro_car_pass() IS
  'Enforces Belgian legal requirement: professional sellers must attach a Car-Pass document. AUDIT item C2.';
