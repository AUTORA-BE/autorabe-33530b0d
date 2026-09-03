DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue-every-minute') THEN
    PERFORM cron.unschedule('process-email-queue-every-minute');
  END IF;
END
$$;

DROP FUNCTION IF EXISTS public.email_queue_dispatch();
DROP FUNCTION IF EXISTS public.email_queue_wake();