CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(m.id), 0)::integer
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE auth.uid() IS NOT NULL
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    AND m.sender_id <> auth.uid()
    AND m.is_read = false;
$$;

REVOKE ALL ON FUNCTION public.get_unread_message_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unread_message_count() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count() TO authenticated;