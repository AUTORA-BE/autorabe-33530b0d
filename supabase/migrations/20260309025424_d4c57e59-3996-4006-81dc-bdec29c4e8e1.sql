
-- Table pour les brouillons d'annonces avec auto-save
CREATE TABLE public.listing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  photo_urls text[] DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un seul brouillon par utilisateur
CREATE UNIQUE INDEX listing_drafts_user_id_idx ON public.listing_drafts (user_id);

-- RLS
ALTER TABLE public.listing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
  ON public.listing_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
  ON public.listing_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON public.listing_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON public.listing_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_listing_drafts_updated_at
  BEFORE UPDATE ON public.listing_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
