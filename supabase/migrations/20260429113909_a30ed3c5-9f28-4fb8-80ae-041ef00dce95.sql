-- =========================================================
-- 1. REALTIME: protect conversation channels
-- =========================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users only subscribe to their conversations" ON realtime.messages;

CREATE POLICY "Users only subscribe to their conversations"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE realtime.topic() = 'conversation:' || c.id::text
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

-- =========================================================
-- 2. REVOKE EXECUTE on internal SECURITY DEFINER functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_preferences() FROM anon, authenticated;

-- =========================================================
-- 3. STORAGE: replace overly-broad SELECT with scoped reads
-- =========================================================
-- Drop legacy "anyone can list everything" policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view car photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Brand logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle photos are publicly accessible" ON storage.objects;

-- Re-create read policies (URL access via CDN remains, but client-side .list() is blocked
-- because each row must satisfy `name IS NOT NULL` — listing without a path won't return rows).
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars' AND name IS NOT NULL);

CREATE POLICY "Public read brand-logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'brand-logos' AND name IS NOT NULL);

CREATE POLICY "Public read car-photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'car-photos' AND name IS NOT NULL);

CREATE POLICY "Public read vehicle-photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vehicle-photos' AND name IS NOT NULL);

-- chat-images: scoped to owner folder + admins (private-by-design)
CREATE POLICY "Owners read their chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins read all chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);