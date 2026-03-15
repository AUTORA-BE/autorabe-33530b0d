ALTER TABLE public.profiles ADD COLUMN phone text;
CREATE UNIQUE INDEX profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;