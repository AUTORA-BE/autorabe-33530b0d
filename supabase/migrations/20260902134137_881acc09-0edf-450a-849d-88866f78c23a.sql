CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;