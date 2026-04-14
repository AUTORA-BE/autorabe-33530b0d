
CREATE TABLE public.fuel_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diesel numeric(5,3) NOT NULL DEFAULT 1.650,
  essence95 numeric(5,3) NOT NULL DEFAULT 1.750,
  essence98 numeric(5,3) NOT NULL DEFAULT 1.850,
  electric_home numeric(5,3) NOT NULL DEFAULT 0.300,
  electric_public numeric(5,3) NOT NULL DEFAULT 0.450,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;

-- Everyone can read fuel prices (displayed on homepage)
CREATE POLICY "Anyone can view fuel prices"
  ON public.fuel_prices FOR SELECT
  TO public
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert fuel prices"
  ON public.fuel_prices FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update fuel prices"
  ON public.fuel_prices FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial row with current Belgian market prices
INSERT INTO public.fuel_prices (diesel, essence95, essence98, electric_home, electric_public)
VALUES (1.650, 1.750, 1.850, 0.300, 0.450);
