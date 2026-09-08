-- Nettoyage ciblé : 5 lignes inertes (status 'inactive', product_id NULL, aucun identifiant Stripe).
-- Suppression strictement par identifiant, jamais par condition large.
DELETE FROM public.subscriptions
WHERE id IN (
  '6ac1b000-5b90-46fd-91c9-a3ff1f79a90f',
  'b543e69f-5b33-44b5-aac5-334fcc913bff',
  '8dc4b07c-f6c5-43f0-bf67-96164330d19f',
  'c512b6fb-c98e-49fc-93b4-705e6c44e24b',
  '74f8f281-1437-43e6-83e6-fec7eccd7cf4'
);