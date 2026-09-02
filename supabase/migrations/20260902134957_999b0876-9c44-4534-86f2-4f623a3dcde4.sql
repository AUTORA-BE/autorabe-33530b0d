CREATE OR REPLACE FUNCTION public.enforce_pro_car_pass()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.seller_type = 'professionnel' AND COALESCE(NEW.status,'active') <> 'draft' THEN
    IF NEW.car_pass_url IS NULL
       OR NEW.car_pass_url !~* '^https://(www\.)?car-pass\.be/' THEN
      RAISE EXCEPTION 'car_pass_required_for_professional'
        USING ERRCODE = 'P0001',
              HINT = 'Un lien Car-Pass valide est obligatoire pour les vendeurs professionnels.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;