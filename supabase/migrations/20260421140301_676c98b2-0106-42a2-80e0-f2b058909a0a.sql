-- TMC brackets table
CREATE TABLE public.belgian_tmc_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL CHECK (region IN ('bruxelles', 'wallonie', 'flandre')),
  cv_min integer NOT NULL,
  cv_max integer NOT NULL,
  base_amount numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE INDEX idx_tmc_region_cv ON public.belgian_tmc_brackets(region, cv_min, cv_max);

-- Annual tax brackets table
CREATE TABLE public.belgian_annual_tax_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL CHECK (region IN ('bruxelles', 'wallonie', 'flandre')),
  cv_min integer NOT NULL,
  cv_max integer NOT NULL,
  base_amount numeric(10,2) NOT NULL,
  diesel_surcharge_pct numeric(5,2) NOT NULL DEFAULT 0,
  lpg_surcharge_per_cv numeric(10,2) NOT NULL DEFAULT 0,
  electric_amount numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE INDEX idx_annual_region_cv ON public.belgian_annual_tax_brackets(region, cv_min, cv_max);

-- Age reduction coefficients (Brussels/Wallonia: progressive; Flanders: linear)
CREATE TABLE public.belgian_tmc_age_reductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL CHECK (region IN ('bruxelles', 'wallonie', 'flandre')),
  age_min_years integer NOT NULL,
  age_max_years integer,
  coefficient numeric(4,3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE INDEX idx_age_region ON public.belgian_tmc_age_reductions(region, age_min_years);

-- Enable RLS
ALTER TABLE public.belgian_tmc_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belgian_annual_tax_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belgian_tmc_age_reductions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view TMC brackets" ON public.belgian_tmc_brackets
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view annual tax brackets" ON public.belgian_annual_tax_brackets
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view age reductions" ON public.belgian_tmc_age_reductions
  FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins can insert TMC brackets" ON public.belgian_tmc_brackets
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update TMC brackets" ON public.belgian_tmc_brackets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete TMC brackets" ON public.belgian_tmc_brackets
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert annual tax" ON public.belgian_annual_tax_brackets
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update annual tax" ON public.belgian_annual_tax_brackets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete annual tax" ON public.belgian_annual_tax_brackets
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert age reductions" ON public.belgian_tmc_age_reductions
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update age reductions" ON public.belgian_tmc_age_reductions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete age reductions" ON public.belgian_tmc_age_reductions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER trg_tmc_updated BEFORE UPDATE ON public.belgian_tmc_brackets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_annual_updated BEFORE UPDATE ON public.belgian_annual_tax_brackets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_age_updated BEFORE UPDATE ON public.belgian_tmc_age_reductions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed TMC brackets (same scale for all 3 regions, simplified Belgian 2025/2026)
INSERT INTO public.belgian_tmc_brackets (region, cv_min, cv_max, base_amount, notes) VALUES
  ('bruxelles', 0, 4, 61.50, 'Petite cylindrée'),
  ('bruxelles', 5, 6, 123.00, NULL),
  ('bruxelles', 7, 8, 495.00, NULL),
  ('bruxelles', 9, 10, 867.00, NULL),
  ('bruxelles', 11, 11, 1239.00, NULL),
  ('bruxelles', 12, 14, 2478.00, NULL),
  ('bruxelles', 15, 17, 4957.00, NULL),
  ('bruxelles', 18, 999, 4957.00, '+500€ par CV au-delà de 17'),
  ('wallonie', 0, 4, 61.50, NULL),
  ('wallonie', 5, 6, 123.00, NULL),
  ('wallonie', 7, 8, 495.00, NULL),
  ('wallonie', 9, 10, 867.00, NULL),
  ('wallonie', 11, 11, 1239.00, NULL),
  ('wallonie', 12, 14, 2478.00, NULL),
  ('wallonie', 15, 17, 4957.00, NULL),
  ('wallonie', 18, 999, 4957.00, '+500€ par CV au-delà de 17'),
  ('flandre', 0, 4, 61.50, 'BIV simplifié — calcul réel basé sur CO2'),
  ('flandre', 5, 6, 123.00, NULL),
  ('flandre', 7, 8, 495.00, NULL),
  ('flandre', 9, 10, 867.00, NULL),
  ('flandre', 11, 11, 1239.00, NULL),
  ('flandre', 12, 14, 2478.00, NULL),
  ('flandre', 15, 17, 4957.00, NULL),
  ('flandre', 18, 999, 4957.00, '+500€ par CV au-delà de 17');

-- Seed annual tax brackets
INSERT INTO public.belgian_annual_tax_brackets (region, cv_min, cv_max, base_amount, diesel_surcharge_pct, lpg_surcharge_per_cv, electric_amount) VALUES
  ('bruxelles', 0, 4, 85, 15, 10, 85),
  ('bruxelles', 5, 6, 149, 15, 10, 85),
  ('bruxelles', 7, 8, 262, 15, 10, 85),
  ('bruxelles', 9, 10, 421, 15, 10, 85),
  ('bruxelles', 11, 11, 543, 15, 10, 85),
  ('bruxelles', 12, 14, 867, 15, 10, 85),
  ('bruxelles', 15, 17, 1239, 15, 10, 85),
  ('bruxelles', 18, 999, 1239, 15, 10, 85),
  ('wallonie', 0, 4, 85, 0, 10, 85),
  ('wallonie', 5, 6, 149, 0, 10, 85),
  ('wallonie', 7, 8, 262, 0, 10, 85),
  ('wallonie', 9, 10, 421, 0, 10, 85),
  ('wallonie', 11, 11, 543, 0, 10, 85),
  ('wallonie', 12, 14, 867, 0, 10, 85),
  ('wallonie', 15, 17, 1239, 0, 10, 85),
  ('wallonie', 18, 999, 1239, 0, 10, 85),
  ('flandre', 0, 4, 85, 0, 10, 0),
  ('flandre', 5, 6, 149, 0, 10, 0),
  ('flandre', 7, 8, 262, 0, 10, 0),
  ('flandre', 9, 10, 421, 0, 10, 0),
  ('flandre', 11, 11, 543, 0, 10, 0),
  ('flandre', 12, 14, 867, 0, 10, 0),
  ('flandre', 15, 17, 1239, 0, 10, 0),
  ('flandre', 18, 999, 1239, 0, 10, 0);

-- Seed age reductions
-- Brussels & Wallonia: progressive
INSERT INTO public.belgian_tmc_age_reductions (region, age_min_years, age_max_years, coefficient) VALUES
  ('bruxelles', 0, 1, 1.00),
  ('bruxelles', 1, 2, 0.85),
  ('bruxelles', 2, 3, 0.70),
  ('bruxelles', 3, 4, 0.55),
  ('bruxelles', 4, 5, 0.40),
  ('bruxelles', 5, NULL, 0.25),
  ('wallonie', 0, 1, 1.00),
  ('wallonie', 1, 2, 0.85),
  ('wallonie', 2, 3, 0.70),
  ('wallonie', 3, 4, 0.55),
  ('wallonie', 4, 5, 0.40),
  ('wallonie', 5, NULL, 0.25),
  -- Flanders: linear -5% per year (single base row, code applies formula)
  ('flandre', 0, NULL, 1.00);