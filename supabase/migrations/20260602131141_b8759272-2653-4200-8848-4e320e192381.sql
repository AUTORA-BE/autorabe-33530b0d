-- 1. Ajout des colonnes user_type & bce_number sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'particulier',
  ADD COLUMN IF NOT EXISTS bce_number text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('particulier','professionnel'));

-- 2. File d'attente de validation des revendeurs
CREATE TABLE IF NOT EXISTS public.dealer_verification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  admin_notes text,
  garage_name_snapshot text,
  bce_snapshot text,
  CONSTRAINT dealer_verification_queue_status_check
    CHECK (status IN ('pending','approved','rejected'))
);

GRANT SELECT, INSERT ON public.dealer_verification_queue TO authenticated;
GRANT ALL ON public.dealer_verification_queue TO service_role;

ALTER TABLE public.dealer_verification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner or admin can view queue" ON public.dealer_verification_queue;
CREATE POLICY "Owner or admin can view queue"
  ON public.dealer_verification_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "User can submit own request" ON public.dealer_verification_queue;
CREATE POLICY "User can submit own request"
  ON public.dealer_verification_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can update queue" ON public.dealer_verification_queue;
CREATE POLICY "Admin can update queue"
  ON public.dealer_verification_queue
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_dvq_status_submitted
  ON public.dealer_verification_queue (status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_dvq_user
  ON public.dealer_verification_queue (user_id);