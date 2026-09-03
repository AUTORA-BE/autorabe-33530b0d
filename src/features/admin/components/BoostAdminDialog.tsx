/**
 * Admin dialog to grant, extend or remove a listing boost.
 * @module features/admin/components
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BOOST_TIERS } from '@/features/listings/constants/boostTiers';
import { useAdminListings } from '../hooks/useAdminListings';
import type { AdminListing } from '../types/admin.types';

interface BoostAdminDialogProps {
  listing: AdminListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoostAdminDialog({ listing, open, onOpenChange }: BoostAdminDialogProps) {
  const { setBoost, isActing } = useAdminListings();

  if (!listing) return null;

  const hasBoost = !!listing.boost_level && listing.boost_level !== 'none';
  const expires = listing.boost_expires_at ? new Date(listing.boost_expires_at) : null;

  const apply = (level: string | null) => {
    setBoost({ id: listing.id, level });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Gérer le boost
          </DialogTitle>
          <DialogDescription>
            {listing.brand} {listing.model} {listing.year}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          {hasBoost ? (
            <>
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px]">
                {listing.boost_level}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {expires
                  ? `expire le ${format(expires, 'dd MMM yyyy HH:mm', { locale: fr })}`
                  : 'sans date d’expiration'}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-xs">Aucun boost</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BOOST_TIERS.map((tier) => (
            <Button
              key={tier.id}
              variant="outline"
              disabled={isActing}
              onClick={() => apply(tier.id)}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              {tier.name}
            </Button>
          ))}
        </div>

        {hasBoost && (
          <Button variant="destructive" disabled={isActing} onClick={() => apply(null)}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Retirer le boost
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BoostAdminDialog;
