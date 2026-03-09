
ALTER TABLE public.car_listings ADD COLUMN IF NOT EXISTS boost_warning_sent boolean DEFAULT false;
