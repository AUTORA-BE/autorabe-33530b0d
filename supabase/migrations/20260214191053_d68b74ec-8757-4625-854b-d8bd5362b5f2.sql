
-- Table des alertes utilisateurs
CREATE TABLE public.user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  frequency text NOT NULL DEFAULT 'instant' CHECK (frequency IN ('instant', 'daily', 'weekly')),
  notify_email boolean NOT NULL DEFAULT true,
  notify_push boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  match_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX idx_user_alerts_active ON public.user_alerts(active) WHERE active = true;

-- RLS
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.user_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON public.user_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.user_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.user_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_user_alerts_updated_at
  BEFORE UPDATE ON public.user_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table historique notifications
CREATE TABLE public.alert_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.user_alerts(id) ON DELETE CASCADE,
  car_listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  match_score integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz
);

-- Indexes
CREATE INDEX idx_alert_notifications_alert_id ON public.alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_sent_at ON public.alert_notifications(sent_at DESC);

-- RLS
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert notifications"
  ON public.alert_notifications FOR SELECT
  USING (
    alert_id IN (
      SELECT id FROM public.user_alerts WHERE user_id = auth.uid()
    )
  );
