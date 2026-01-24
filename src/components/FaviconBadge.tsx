import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useFaviconBadge } from '@/hooks/useFaviconBadge';

export function FaviconBadge() {
  const { unreadCount } = useUnreadMessages();
  useFaviconBadge(unreadCount);
  
  return null;
}
