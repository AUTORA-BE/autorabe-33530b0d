-- ============================================================
-- contact_messages — persists all contact form submissions
-- Used for admin review and audit trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL CHECK (char_length(name)    BETWEEN 2 AND 100),
  email         text        NOT NULL CHECK (char_length(email)   BETWEEN 5 AND 255),
  subject       text        NOT NULL CHECK (char_length(subject) BETWEEN 5 AND 200),
  message       text        NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  ip_address    text,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status        text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new','read','replied','spam')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  replied_at    timestamptz
);

-- Only admins can read; nobody can write directly (only via Edge Function with service_role)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_contact_messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for admin moderation queue
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
  ON public.contact_messages (status, created_at DESC);
