
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS presentation TEXT;
