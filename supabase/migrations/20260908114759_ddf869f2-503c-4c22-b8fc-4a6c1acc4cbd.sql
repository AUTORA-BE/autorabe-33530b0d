-- 1) Reviews readable by anonymous visitors, based on the public catalog view
--    (car_listings_public is a security-definer view already granted to anon,
--     so it is the same public surface used by the catalog; the protected
--     car_listings table stays closed to anon.)
GRANT SELECT ON public.reviews TO anon;

DROP POLICY IF EXISTS "Anyone can view reviews on approved listings" ON public.reviews;
CREATE POLICY "Anyone can view reviews on approved listings"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.car_listings_public p
    WHERE p.id = reviews.car_listing_id
  )
);

-- 2) chat-images: the object path is "<uploader_uid>/<ts>.<ext>" and carries no
--    conversation id, but messages.image_url stores exactly that path, so the
--    link object -> conversation is deducible via messages. A SECURITY DEFINER
--    helper avoids depending on the caller's RLS over messages/conversations.
CREATE OR REPLACE FUNCTION public.can_read_chat_image(_object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.image_url = _object_name
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
$$;

REVOKE ALL ON FUNCTION public.can_read_chat_image(text) FROM public;
GRANT EXECUTE ON FUNCTION public.can_read_chat_image(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Conversation participants read chat images" ON storage.objects;
CREATE POLICY "Conversation participants read chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-images'
  AND public.can_read_chat_image(name)
);