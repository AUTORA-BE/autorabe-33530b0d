
-- Daily message counter for free users rate limiting
CREATE TABLE public.daily_message_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_date)
);

-- Enable RLS
ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

-- Users can view their own counts
CREATE POLICY "Users can view own message counts"
  ON public.daily_message_counts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own counts
CREATE POLICY "Users can insert own message counts"
  ON public.daily_message_counts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own counts
CREATE POLICY "Users can update own message counts"
  ON public.daily_message_counts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
