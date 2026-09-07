-- 1. Un seul état d'attente : 'pending_review' (celui qu'écrit le déclencheur
--    guard_sensitive_listing_updates). La valeur par défaut le rejoint.
ALTER TABLE public.car_listings ALTER COLUMN status SET DEFAULT 'pending_review';

-- 2. Migration des lignes éventuellement restées dans l'ancien état.
--    prevent_status_self_change refuse tout changement de statut hors admin
--    authentifié ; une migration s'exécute sans auth.uid(). On utilise ici
--    l'échappatoire prévue par l'auteur du déclencheur, uniquement pour cette
--    reprise de vocabulaire. Elle ne doit jamais apparaître en code applicatif.
SELECT set_config('autora.rereview', '1', true);
UPDATE public.car_listings SET status = 'pending_review' WHERE status = 'pending';

-- 3. Resserrage de la contrainte : 'pending' n'est plus une valeur possible.
ALTER TABLE public.car_listings DROP CONSTRAINT car_listings_status_check;
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_listings_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'approved'::text, 'sold'::text, 'rejected'::text, 'archived'::text]));