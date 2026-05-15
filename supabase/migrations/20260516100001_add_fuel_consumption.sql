ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS fuel_consumption NUMERIC(5,2);

COMMENT ON COLUMN public.car_listings.fuel_consumption IS
  'Consommation mixte : L/100km pour thermiques, kWh/100km pour électriques';
