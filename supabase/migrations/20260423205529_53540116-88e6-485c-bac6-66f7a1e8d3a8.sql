
-- ============================================================
-- AUDIT SÉCURITÉ — Corrections pré-lancement AutoRa
-- ============================================================

-- ============================================================
-- 1. PROFILES : restreindre accès aux champs sensibles
-- ============================================================
-- Supprimer la policy trop large qui expose phone/postal_code/suspended_*
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

-- Owner peut voir son profil complet
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- (Admins gardent leur policy "Admins can view all profiles" déjà en place)
-- Pour l'accès public limité (display_name + avatar), on s'appuie sur la vue profiles_public déjà existante.

-- ============================================================
-- 2. CAR_LISTINGS : auth users ne voient que les annonces approuvées
--    (en plus de leurs propres annonces et de l'accès admin)
-- ============================================================
CREATE POLICY "Authenticated users can view approved listings"
ON public.car_listings
FOR SELECT
TO authenticated
USING (status = 'approved');

-- (Owners et admins gardent leurs policies existantes)

-- ============================================================
-- 3. STORAGE : bucket car-pass passe en privé + ownership
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'car-pass';

-- Supprimer toute policy SELECT trop large sur car-pass
DROP POLICY IF EXISTS "Public read access for car-pass" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view car-pass" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Owner du fichier (uid = premier segment du path) peut lire
CREATE POLICY "Owners can read their car-pass"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'car-pass'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins peuvent tout lire (modération)
CREATE POLICY "Admins can read all car-pass"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'car-pass'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ============================================================
-- 4. STORAGE chat-images : enlever la policy INSERT trop permissive
-- ============================================================
DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;
-- (la policy stricte "Authenticated users can upload chat images" est conservée)

-- ============================================================
-- 5. REALTIME : retirer car_listings du publication realtime public
--    (le browsing utilise React Query, pas Realtime)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'car_listings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.car_listings';
  END IF;
END $$;
