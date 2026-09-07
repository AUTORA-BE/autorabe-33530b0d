-- Migration strictement additive : clés étrangères manquantes vers auth.users.
-- Aucun DROP, aucun DELETE, aucun UPDATE de données. Zéro ligne orpheline vérifiée avant application.
--
-- CHOIX DÉLIBÉRÉ — NE PAS "COMPLÉTER" PLUS TARD :
--   audit_log.user_id et admin_actions.admin_id n'ont volontairement AUCUNE contrainte.
--   Les deux colonnes sont NOT NULL (SET NULL impossible) et un CASCADE détruirait la piste
--   d'audit, que delete-account conserve intentionnellement. Après suppression du compte,
--   l'UUID ne pointe plus vers personne : la trace reste, la personne n'est plus identifiable.
--
-- Les contraintes déjà présentes (car_listings, favorites, conversations, messages, user_roles,
-- dealer_kyc, dealer_verification_queue.user_id, car_views.viewer_id,
-- car_pass_verification_requests.requested_by, contact_messages.user_id) ne sont pas retouchées.

-- ── ON DELETE CASCADE ───────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_alerts
  ADD CONSTRAINT user_alerts_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.listing_drafts
  ADD CONSTRAINT listing_drafts_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.daily_message_counts
  ADD CONSTRAINT daily_message_counts_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.dealer_events
  ADD CONSTRAINT dealer_events_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── ON DELETE SET NULL (administrateurs / tiers, pas le sujet de la ligne) ──
ALTER TABLE public.dealer_events
  ADD CONSTRAINT dealer_events_actor_id_fkey FOREIGN KEY (actor_id)
  REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.dealer_verification_queue
  ADD CONSTRAINT dealer_verification_queue_reviewed_by_fkey FOREIGN KEY (reviewed_by)
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── Index manquants sur les colonnes portantes (les autres existent déjà) ──
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_dealer_events_actor_id ON public.dealer_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_dvq_reviewed_by ON public.dealer_verification_queue (reviewed_by);
