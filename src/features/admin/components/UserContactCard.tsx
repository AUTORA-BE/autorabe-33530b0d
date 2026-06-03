/**
 * UserContactCard — admin-only dialog showing a user's full contact info
 * (profile + auth email). Reused by Users & Payments pages.
 * @module features/admin/components
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, MapPin, Building2, Calendar, Crown, Hash, Copy, ExternalLink, Ban, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUBSCRIPTION_TIERS } from '@/features/subscription/constants/tiers';

export interface UserContactInfo {
  user_id: string;
  email: string | null;
  display_name: string | null;
  garage_name: string | null;
  user_type: string | null;
  phone: string | null;
  postal_code: string | null;
  avatar_url: string | null;
  bce_number: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  listing_count: number;
  subscription_product_id: string | null;
  subscription_status: string | null;
  subscription_end: string | null;
}

function planLabel(productId: string | null, status: string | null) {
  if (!productId || status !== 'active') return 'Gratuit';
  const tier = Object.values(SUBSCRIPTION_TIERS).find(t => t.product_id === productId);
  return tier ? tier.name : 'Inconnu';
}

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserContactCard({ userId, open, onOpenChange }: Props) {
  const [data, setData] = useState<UserContactInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    (async () => {
      const { data: rows, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>
      ) => Promise<{ data: UserContactInfo[] | null; error: { message: string } | null }>)(
        'admin_get_user_contact', { _user_id: userId },
      );
      if (cancelled) return;
      if (error) {
        toast.error('Impossible de charger la fiche utilisateur');
        setLoading(false);
        return;
      }
      setData(rows?.[0] ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId, open]);

  const copy = (val: string | null, label: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => toast.success(`${label} copié`));
  };

  const plan = data ? planLabel(data.subscription_product_id, data.subscription_status) : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Fiche utilisateur</DialogTitle>
        </DialogHeader>

        {loading || !data ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30">
              <Avatar className="h-14 w-14">
                <AvatarImage src={data.avatar_url || ''} />
                <AvatarFallback>{(data.display_name || '?')[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold truncate">{data.display_name || 'Sans nom'}</p>
                  {data.suspended_at && <Badge variant="destructive" className="text-[9px]">Suspendu</Badge>}
                  {data.user_type === 'professionnel' && <Badge variant="outline" className="text-[9px]">Pro</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{data.user_id}</p>
              </div>
              <Badge className="text-[10px]" variant="secondary">
                <Crown className="h-3 w-3 mr-1" /> {plan}
              </Badge>
            </div>

            {/* Coordonnées */}
            <div className="space-y-1.5">
              <Row icon={Mail} label="Email" value={data.email} onCopy={() => copy(data.email, 'Email')} />
              <Row icon={Phone} label="Téléphone" value={data.phone} onCopy={() => copy(data.phone, 'Téléphone')} />
              <Row icon={MapPin} label="Code postal" value={data.postal_code} />
              <Row icon={Building2} label="Garage" value={data.garage_name} />
              <Row icon={Hash} label="N° BCE" value={data.bce_number} />
              <Row
                icon={Calendar}
                label="Inscription"
                value={format(new Date(data.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
              />
              {data.subscription_end && (
                <Row
                  icon={Calendar}
                  label="Fin abonnement"
                  value={format(new Date(data.subscription_end), 'dd MMM yyyy', { locale: fr })}
                />
              )}
              {data.suspended_at && (
                <div className="p-2.5 rounded-lg border border-destructive/40 bg-destructive/5 text-xs">
                  <p className="font-medium text-destructive flex items-center gap-1.5"><Ban className="h-3 w-3" /> Suspendu</p>
                  {data.suspended_reason && <p className="text-muted-foreground mt-1">{data.suspended_reason}</p>}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg border border-border p-2.5">
                <p className="text-lg font-semibold text-foreground">{data.listing_count}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Annonces</p>
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <p className="text-lg font-semibold text-foreground">{plan}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Plan actif</p>
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <Button asChild size="sm" variant="outline">
                <a href={`/seller/${data.user_id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Voir profil public
                </a>
              </Button>
              {data.email && (
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${data.email}`}>
                    <Mail className="h-3.5 w-3.5 mr-1" /> Contacter
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  onCopy?: () => void;
}

function Row({ icon: Icon, label, value, onCopy }: RowProps) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-secondary/50 group">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-xs text-foreground flex-1 truncate">{value || <span className="text-muted-foreground">—</span>}</span>
      {value && onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-secondary"
          aria-label={`Copier ${label}`}
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
