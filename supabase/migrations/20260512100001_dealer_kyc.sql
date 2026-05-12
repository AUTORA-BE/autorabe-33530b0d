-- C3: DSA Art. 30 — KYC for professional (trader) accounts.
-- Dealers must upload identity/company documents before listings are publicly visible.

CREATE TABLE IF NOT EXISTS public.dealer_kyc (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'verified', 'rejected')),
  document_path     TEXT,       -- Storage path: dealer-kyc/<user_id>/<filename>
  submitted_at      TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  reviewer_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_note     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dealer_kyc ENABLE ROW LEVEL SECURITY;

-- Dealer can read their own KYC record
CREATE POLICY "Dealer reads own KYC"
  ON public.dealer_kyc
  FOR SELECT
  USING (auth.uid() = user_id);

-- Dealer can insert their own KYC record (once)
CREATE POLICY "Dealer inserts own KYC"
  ON public.dealer_kyc
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Dealer can update their own pending KYC (re-submit)
CREATE POLICY "Dealer updates own pending KYC"
  ON public.dealer_kyc
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all KYC records
CREATE POLICY "Admins read all KYC"
  ON public.dealer_kyc
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any KYC record (approve/reject)
CREATE POLICY "Admins update any KYC"
  ON public.dealer_kyc
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_dealer_kyc_updated_at
  BEFORE UPDATE ON public.dealer_kyc
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for admin panel queries by status
CREATE INDEX idx_dealer_kyc_status ON public.dealer_kyc (status);
CREATE INDEX idx_dealer_kyc_user ON public.dealer_kyc (user_id);

-- Storage bucket for KYC documents (private, admin + owner access only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dealer-kyc',
  'dealer-kyc',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: owners can upload to their own folder
CREATE POLICY "Dealer uploads own KYC doc"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dealer-kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: owners can read their own document
CREATE POLICY "Dealer reads own KYC doc"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dealer-kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: admins can read all KYC documents
CREATE POLICY "Admins read all KYC docs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dealer-kyc'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
