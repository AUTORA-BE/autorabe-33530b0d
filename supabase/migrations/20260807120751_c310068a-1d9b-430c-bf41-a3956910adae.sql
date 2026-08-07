DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM anon;

GRANT ALL ON public.audit_log TO service_role;