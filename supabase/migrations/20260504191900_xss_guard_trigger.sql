-- ============================================================
-- Task 2 — XSS hardening at the DB layer
--
-- Reject any insert/update on car_listings or messages that contains
--   <script…   or   on*=   inline event handler   or   javascript: URL
-- This is belt-and-braces alongside the client/edge sanitizers.
-- ============================================================

CREATE OR REPLACE FUNCTION public.reject_html_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  bad_pattern text := '(<\s*script|<\s*iframe|<\s*object|<\s*embed|on\w+\s*=|javascript\s*:|vbscript\s*:)';
BEGIN
  -- Description (long text) — main vector
  IF NEW.description IS NOT NULL
     AND NEW.description ~* bad_pattern THEN
    RAISE EXCEPTION
      'XSS_BLOCKED: description contains forbidden HTML/JS markup'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Free-text fields that get rendered to other users
  IF (TG_TABLE_NAME = 'car_listings') THEN
    IF NEW.location IS NOT NULL
       AND NEW.location ~* bad_pattern THEN
      RAISE EXCEPTION 'XSS_BLOCKED: location contains forbidden markup'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.contact_name IS NOT NULL
       AND NEW.contact_name ~* bad_pattern THEN
      RAISE EXCEPTION 'XSS_BLOCKED: contact_name contains forbidden markup'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS car_listings_xss_guard ON public.car_listings;
CREATE TRIGGER car_listings_xss_guard
  BEFORE INSERT OR UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_html_payload();
