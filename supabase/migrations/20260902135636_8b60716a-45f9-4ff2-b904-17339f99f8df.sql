CREATE TABLE IF NOT EXISTS public.ops_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text NOT NULL,
  severity    text NOT NULL DEFAULT 'error'
              CHECK (severity IN ('warn','error','critical')),
  message     text NOT NULL,
  context     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);

GRANT SELECT ON public.ops_alerts TO authenticated;
GRANT ALL ON public.ops_alerts TO service_role;

ALTER TABLE public.ops_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins read ops_alerts" ON public.ops_alerts
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ops_alerts_pending
  ON public.ops_alerts (created_at DESC) WHERE notified_at IS NULL;

-- Cron horaire : déclenche le récapitulatif des incidents non notifiés.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ops-alerts-digest') THEN
    PERFORM cron.unschedule('ops-alerts-digest');
  END IF;
  PERFORM cron.schedule(
    'ops-alerts-digest',
    '0 * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://jbdsjqoonpieusfvkhyo.supabase.co/functions/v1/ops-alerts-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Lovable-Context', 'cron',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ops-alerts-digest cron scheduling failed: %', SQLERRM;
END $$;