/**
 * Button shown next to a listing in the seller dashboard.
 *
 * Renders one of:
 *   - "Demander la vérification Car-Pass"
 *   - "En attente de vérification" (disabled, pulsing)
 *   - "Car-Pass vérifié" (badge)
 *   - "Refusé — réessayer" if a previous attempt failed
 *
 * Hides the listing from public search until verified — see the SQL view.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldAlert, Clock, RefreshCcw } from 'lucide-react';
import { useCarPassVerification, type CarPassStatus } from '../hooks/useCarPassVerification';
import { toast } from 'sonner';

interface Props {
  listingId: string;
  initialStatus: CarPassStatus | null | undefined;
  /** Optional callback after a successful verification — useful to refetch */
  onSuccess?: () => void;
}

export function CarPassVerifyButton({ listingId, initialStatus, onSuccess }: Props) {
  const { verify, isVerifying } = useCarPassVerification();
  const [status, setStatus] = useState<CarPassStatus>(initialStatus ?? 'unverified');

  const handleClick = async () => {
    const res = await verify(listingId);
    if (res) {
      const next = (res.status === 'failed' ? 'rejected' : res.status) as CarPassStatus;
      setStatus(next);
      if (next === 'pending') {
        toast.success('Document Car-Pass envoyé — en attente de vérification par notre équipe (24-48h)');
        onSuccess?.();
      } else if (next === 'verified') {
        toast.success('Car-Pass vérifié — votre annonce est maintenant visible');
        onSuccess?.();
      } else if (next === 'rejected') {
        toast.error('La soumission Car-Pass a échoué. Vérifiez que le document est bien uploadé ou contactez le support.');
      }
    } else {
      toast.error('Impossible de soumettre le Car-Pass. Réessayez plus tard.');
    }
  };

  if (status === 'verified') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <ShieldCheck className="w-3 h-3 mr-1" />
        Car-Pass vérifié
      </Badge>
    );
  }

  if (status === 'pending' || isVerifying) {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-600">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Vérification en cours…
      </Badge>
    );
  }

  if (status === 'rejected') {
    return (
      <Button size="sm" variant="outline" onClick={handleClick} disabled={isVerifying}>
        <RefreshCcw className="w-3 h-3 mr-1" />
        Réessayer la vérification
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={isVerifying} className="gap-1.5">
      <ShieldAlert className="w-3 h-3" />
      Soumettre le Car-Pass pour vérification
    </Button>
  );
}
