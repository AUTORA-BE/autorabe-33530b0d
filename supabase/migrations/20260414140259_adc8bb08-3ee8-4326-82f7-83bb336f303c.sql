
-- Allow authenticated users to read basic profile info (needed for chat, messaging display)
-- The profiles_public view already filters sensitive fields for public display
CREATE POLICY "Authenticated users can view basic profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive own-profile-only policy (redundant now)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
