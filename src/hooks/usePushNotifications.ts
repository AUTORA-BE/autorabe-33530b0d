import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | 'unsupported';
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: 'unsupported',
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const supported = 
      'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window;
    
    return supported;
  }, []);

  // Get VAPID public key from edge function
  const getVapidPublicKey = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
      
      if (error) {
        console.error('Error getting VAPID key:', error);
        return null;
      }
      
      return data?.publicKey || null;
    } catch (error) {
      console.error('Error fetching VAPID key:', error);
      return null;
    }
  }, []);

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = useCallback((base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  }, []);

  // Get existing service worker registration (managed by vite-plugin-pwa)
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Save subscription to database
  const saveSubscription = useCallback(async (subscription: PushSubscription): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys as { p256dh: string; auth: string };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: session.user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Error saving subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving subscription:', error);
      return false;
    }
  }, []);

  // Remove subscription from database
  const removeSubscription = useCallback(async (endpoint: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', session.user.id)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('Error removing subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing subscription:', error);
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast.error('Autorisation refusée pour les notifications');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Get VAPID key
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        toast.error('Impossible de configurer les notifications');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        toast.error('Erreur lors de l\'enregistrement du service');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save to database
      const saved = await saveSubscription(subscription);
      if (!saved) {
        toast.error('Erreur lors de l\'enregistrement');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      setState(prev => ({ ...prev, isSubscribed: true, isLoading: false }));
      toast.success('Notifications activées !');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [getVapidPublicKey, registerServiceWorker, saveSubscription, urlBase64ToUint8Array]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscription(subscription.endpoint);
      }

      setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }));
      toast.success('Notifications désactivées');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Erreur lors de la désactivation');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [removeSubscription]);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState({
        isSupported: false,
        isSubscribed: false,
        isLoading: false,
        permission: 'unsupported',
      });
      return;
    }

    try {
      const permission = Notification.permission;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      setState({
        isSupported: true,
        isSubscribed: !!subscription,
        isLoading: false,
        permission,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState({
        isSupported: true,
        isSubscribed: false,
        isLoading: false,
        permission: Notification.permission,
      });
    }
  }, [checkSupport]);

  // Initialize on mount
  useEffect(() => {
    // Register service worker on page load
    if (checkSupport()) {
      registerServiceWorker().then(() => {
        checkSubscription();
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkSupport, checkSubscription, registerServiceWorker]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}
