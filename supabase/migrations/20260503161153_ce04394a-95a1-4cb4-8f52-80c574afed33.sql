-- Stripe webhook idempotency table
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload_summary jsonb
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_type
  ON public.stripe_processed_events(event_type);

-- Lock down: only service_role can read/write (webhook runs as service)
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role only stripe events"
  ON public.stripe_processed_events
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');