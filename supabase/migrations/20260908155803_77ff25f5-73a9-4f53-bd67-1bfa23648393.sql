-- Cleanup of the two test accounts created during signup verification.
-- Strictly targeted by user id; no email/date predicates.
DELETE FROM public.dealer_events
 WHERE user_id IN ('9de6f268-009f-40f7-a9c1-a74d5dc30e5c','a96aad41-a697-464d-bd48-493f9e79d81e')
    OR actor_id IN ('9de6f268-009f-40f7-a9c1-a74d5dc30e5c','a96aad41-a697-464d-bd48-493f9e79d81e');

DELETE FROM public.dealer_verification_queue
 WHERE user_id IN ('9de6f268-009f-40f7-a9c1-a74d5dc30e5c','a96aad41-a697-464d-bd48-493f9e79d81e');

DELETE FROM public.user_preferences
 WHERE user_id IN ('9de6f268-009f-40f7-a9c1-a74d5dc30e5c','a96aad41-a697-464d-bd48-493f9e79d81e');

DELETE FROM public.profiles
 WHERE user_id IN ('9de6f268-009f-40f7-a9c1-a74d5dc30e5c','a96aad41-a697-464d-bd48-493f9e79d81e');

DELETE FROM auth.users
 WHERE id IN ('9de6f268-009f-40f7-a9c1-a74d5dc30e5c','a96aad41-a697-464d-bd48-493f9e79d81e');
