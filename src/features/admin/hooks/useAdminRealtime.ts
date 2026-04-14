/**
 * Hook for Supabase Realtime subscriptions on admin overview
 * Auto-invalidates stats when reports or listings change
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAdminRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-overview-realtime')
      
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'car_listings' },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
          qc.invalidateQueries({ queryKey: ['admin', 'listings'] });
          qc.invalidateQueries({ queryKey: ['admin', 'charts'] });
          if (payload.eventType === 'INSERT') {
            const rec = payload.new as { status?: string };
            if (rec.status === 'pending') {
              toast.info('📋 Nouvelle annonce en attente de modération', { duration: 5000 });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
