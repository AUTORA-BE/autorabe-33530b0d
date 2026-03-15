/**
 * Auto-prompts push notification permission after first login.
 * Stores a flag in localStorage so the user is only prompted once.
 */
import { useEffect } from 'react';
import { usePushNotifications } from './usePushNotifications';

const PROMPTED_KEY = 'autora_push_prompted';

export function useAutoPromptPush(userId: string | undefined) {
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();

  useEffect(() => {
    if (!userId || isLoading || !isSupported || isSubscribed) return;
    if (localStorage.getItem(PROMPTED_KEY)) return;

    // Small delay to avoid blocking initial page render
    const timer = setTimeout(() => {
      localStorage.setItem(PROMPTED_KEY, '1');
      subscribe();
    }, 3000);

    return () => clearTimeout(timer);
  }, [userId, isLoading, isSupported, isSubscribed, subscribe]);
}
