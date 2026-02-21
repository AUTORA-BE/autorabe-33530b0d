
-- 1. Admin actions audit table
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL, -- 'approve_listing', 'reject_listing', 'delete_listing', 'suspend_user', 'unsuspend_user', 'dismiss_report', 'resolve_report'
  target_type text NOT NULL, -- 'listing', 'user', 'report'
  target_id uuid NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin actions"
  ON public.admin_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions"
  ON public.admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE INDEX idx_admin_actions_target ON public.admin_actions (target_type, target_id);
CREATE INDEX idx_admin_actions_admin ON public.admin_actions (admin_id);
CREATE INDEX idx_admin_actions_created ON public.admin_actions (created_at DESC);

-- 2. GDPR audit log for data access tracking
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'data_export', 'account_deletion', 'profile_view', 'consent_update'
  details jsonb DEFAULT '{}',
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_log_user ON public.audit_log (user_id);
CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);

-- 3. Account suspension field on profiles
ALTER TABLE public.profiles
  ADD COLUMN suspended_at timestamptz DEFAULT NULL,
  ADD COLUMN suspended_reason text DEFAULT NULL;

-- 4. Function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND suspended_at IS NOT NULL
  )
$$;
