/**
 * Hook calling the verify-car-pass Edge Function.
 *
 * Usage:
 *   const { verify, status, isVerifying, error } = useCarPassVerification();
 *   await verify(listingId);
 *
 * The hook does NOT poll — the Edge Function returns the final status
 * synchronously (verified | rejected | failed).  When a real Car-Pass API
 * is wired and verification becomes truly async, swap to a Realtime
 * subscription on car_pass_verification_requests.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export type CarPassStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerifyResult {
  request_id: string;
  status: CarPassStatus | 'failed';
}

export function useCarPassVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CarPassStatus | null>(null);
  const qc = useQueryClient();

  const verify = useCallback(
    async (listingId: string): Promise<VerifyResult | null> => {
      setIsVerifying(true);
      setError(null);
      setStatus('pending');
      try {
        const { data, error: fnErr } = await supabase.functions.invoke<VerifyResult>(
          'verify-car-pass',
          { body: { listing_id: listingId } },
        );
        if (fnErr) throw fnErr;
        if (!data) throw new Error('Réponse vide du serveur');

        const final =
          data.status === 'failed' ? 'rejected' : (data.status as CarPassStatus);
        setStatus(final);
        // Invalidate the seller's own listings & detail caches so the new
        // car_pass_status is picked up everywhere.
        qc.invalidateQueries({ queryKey: ['vehicle'] });
        qc.invalidateQueries({ queryKey: ['vehicles'] });
        qc.invalidateQueries({ queryKey: ['seller-listings'] });
        return data;
      } catch (e) {
        const msg = (e as Error).message ?? 'Erreur réseau';
        setError(msg);
        setStatus('rejected');
        return null;
      } finally {
        setIsVerifying(false);
      }
    },
    [qc],
  );

  return { verify, status, isVerifying, error };
}
