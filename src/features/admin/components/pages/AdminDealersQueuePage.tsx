/**
 * Admin — Dealer Verification Queue
 * Validate or reject professional signups (Belgian garages / concessions).
 * @module features/admin/components/pages/AdminDealersQueuePage
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Mail, ExternalLink, Clock, Loader2, ShieldCheck, AlertTriangle,
  FileCheck2, Leaf,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type QueueStatus = 'pending' | 'approved' | 'rejected';

interface DealerRow {
  id: string;
  user_id: string;
  status: QueueStatus;
  submitted_at: string;
  reviewed_at: string | null;
  garage_name_snapshot: string | null;
  bce_snapshot: string | null;
  admin_notes: string | null;
  // Joined from profiles
  display_name?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  email?: string | null;
  // Aggregated from car_listings
  listings_count?: number;
  car_pass_verified_count?: number;
  lez_eligible_count?: number;
}

// Euro norms autorisées en LEZ Bruxelles/Anvers/Gand en 2026 (essence ≥ Euro 4, diesel ≥ Euro 6).
// Approximation conservatrice : on flag "LEZ-OK" si euro_norm ∈ {Euro 5, Euro 6, Euro 6d}.
const LEZ_OK_NORMS = new Set(['Euro 5', 'Euro 6', 'Euro 6d', 'Euro 6d-TEMP']);

const STATUS_META: Record<QueueStatus, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30', icon: Clock },
  approved: { label: 'Validé', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: 'Refusé', cls: 'bg-red-500/15 text-red-500 border-red-500/30', icon: XCircle },
};

export default function AdminDealersQueuePage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DealerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DealerRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dealer_verification_queue')
      .select('id, user_id, status, submitted_at, reviewed_at, garage_name_snapshot, bce_snapshot, admin_notes')
      .order('submitted_at', { ascending: false })
      .limit(500);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const queueRows = (data ?? []) as DealerRow[];

    if (queueRows.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const userIds = queueRows.map((r) => r.user_id);
    const [{ data: profiles }, { data: listings }] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, display_name, phone, postal_code')
        .in('user_id', userIds),
      supabase
        .from('car_listings')
        .select('user_id, car_pass_verified, euro_norm, status')
        .in('user_id', userIds),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // Aggregate Car-Pass + LEZ per user from approved listings only
    const stats = new Map<string, { total: number; cp: number; lez: number }>();
    for (const l of listings ?? []) {
      if (l.status !== 'approved') continue;
      const s = stats.get(l.user_id) ?? { total: 0, cp: 0, lez: 0 };
      s.total += 1;
      if (l.car_pass_verified) s.cp += 1;
      if (l.euro_norm && LEZ_OK_NORMS.has(l.euro_norm)) s.lez += 1;
      stats.set(l.user_id, s);
    }

    setRows(
      queueRows.map((r) => {
        const p = profileMap.get(r.user_id);
        const s = stats.get(r.user_id);
        return {
          ...r,
          display_name: p?.display_name ?? null,
          phone: p?.phone ?? null,
          postal_code: p?.postal_code ?? null,
          listings_count: s?.total ?? 0,
          car_pass_verified_count: s?.cp ?? 0,
          lez_eligible_count: s?.lez ?? 0,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (tab === 'all' ? rows : rows.filter((r) => r.status === tab)),
    [rows, tab],
  );

  const counts = useMemo(
    () => ({
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
    }),
    [rows],
  );

  const approve = async (row: DealerRow) => {
    setBusyId(row.id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error: qErr } = await supabase
        .from('dealer_verification_queue')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.user?.id ?? null,
          admin_notes: null,
        })
        .eq('id', row.id);
      if (qErr) throw qErr;

      await supabase.from('profiles').update({ user_type: 'professionnel' }).eq('user_id', row.user_id);

      await supabase.from('admin_actions').insert({
        admin_id: auth.user!.id,
        target_id: row.user_id,
        target_type: 'user',
        action_type: 'dealer_approved',
        reason: 'Approved from /admin/dealers',
        metadata: { queue_id: row.id, garage: row.garage_name_snapshot, bce: row.bce_snapshot },
      });

      // Resolve recipient email from auth via display_name fallback — we need real email.
      // Use admin_get_listing_contacts is listing-only. We rely on auth.users via the
      // welcome/notification: pull from user_preferences? Simpler — call notify by user_id pattern.
      // Workaround: we send to the address stored in latest car_listings.contact_email or skip.
      // For reliability, fetch from auth via RPC is unavailable here. We pass user_id and the
      // edge fn already requires recipientEmail. Easiest: read profile.display_name (often the email
      // in our project). To stay safe, we attempt a lookup on car_listings first.
      const email = await resolveUserEmail(row.user_id);
      if (email) {
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'dealer-approved',
            recipientEmail: email,
            idempotencyKey: `dealer-approved-${row.id}`,
            templateData: {
              name: row.display_name ?? undefined,
              garageName: row.garage_name_snapshot ?? undefined,
            },
          },
        }).catch(() => {});
      }

      toast({ title: 'Compte validé', description: 'L’utilisateur sera notifié par email.' });
      await load();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Validation impossible',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast({ title: 'Motif requis', description: 'Indiquez au moins 3 caractères.', variant: 'destructive' });
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error: qErr } = await supabase
        .from('dealer_verification_queue')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.user?.id ?? null,
          admin_notes: reason,
        })
        .eq('id', rejectTarget.id);
      if (qErr) throw qErr;

      await supabase.from('profiles').update({ user_type: 'particulier' }).eq('user_id', rejectTarget.user_id);

      await supabase.from('admin_actions').insert({
        admin_id: auth.user!.id,
        target_id: rejectTarget.user_id,
        target_type: 'user',
        action_type: 'dealer_rejected',
        reason,
        metadata: { queue_id: rejectTarget.id },
      });

      const email = await resolveUserEmail(rejectTarget.user_id);
      if (email) {
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'dealer-rejected',
            recipientEmail: email,
            idempotencyKey: `dealer-rejected-${rejectTarget.id}`,
            templateData: {
              name: rejectTarget.display_name ?? undefined,
              reason,
            },
          },
        }).catch(() => {});
      }

      toast({ title: 'Demande refusée', description: 'L’utilisateur a été notifié.' });
      setRejectTarget(null);
      setRejectReason('');
      await load();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Refus impossible',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Validation revendeurs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modération des inscriptions professionnelles (garages, concessionnaires).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>Rafraîchir</Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="pending" className="gap-2">
            En attente <Badge variant="secondary">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Validés <Badge variant="secondary">{counts.approved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Refusés <Badge variant="secondary">{counts.rejected}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-60" />
              Aucune demande dans cette catégorie.
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((row) => {
                const meta = STATUS_META[row.status];
                const StatusIcon = meta.icon;
                return (
                  <Card key={row.id} className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base truncate">
                            {row.display_name || 'Sans nom'}
                          </h3>
                          <Badge variant="outline" className={meta.cls}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {meta.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                          <span><strong className="text-foreground">Garage :</strong> {row.garage_name_snapshot || '—'}</span>
                          <span><strong className="text-foreground">BCE :</strong> {row.bce_snapshot || '—'}</span>
                          <span><strong className="text-foreground">Téléphone :</strong> {row.phone || '—'}</span>
                          <span><strong className="text-foreground">CP :</strong> {row.postal_code || '—'}</span>
                          <span className="sm:col-span-2 text-xs">
                            Soumis le {new Date(row.submitted_at).toLocaleString('fr-BE')}
                            {row.reviewed_at && ` · revu le ${new Date(row.reviewed_at).toLocaleString('fr-BE')}`}
                          </span>
                          {row.admin_notes && (
                            <span className="sm:col-span-2 text-xs italic">
                              Motif : {row.admin_notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/seller/${row.user_id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Profil
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const email = await resolveUserEmail(row.user_id);
                            if (!email) {
                              toast({ title: 'Email introuvable', variant: 'destructive' });
                              return;
                            }
                            window.location.href = `mailto:${email}?subject=${encodeURIComponent('Votre compte professionnel AutoRA')}`;
                          }}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1.5" /> Contacter
                        </Button>
                        {row.status !== 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => approve(row)}
                            disabled={busyId === row.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                            Valider
                          </Button>
                        )}
                        {row.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectTarget(row);
                              setRejectReason('');
                            }}
                            disabled={busyId === row.id}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" /> Refuser
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande pro</DialogTitle>
            <DialogDescription>
              Un email sera envoyé à l'utilisateur avec le motif ci-dessous. Le compte sera
              rétrogradé en particulier.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ex : Numéro BCE manquant ou invalide, garage non identifié, etc."
            rows={4}
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={reject} disabled={busyId === rejectTarget?.id}>
              {busyId === rejectTarget?.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Resolves a user's email via the admin-only RPC `admin_get_user_emails`
 * (SECURITY DEFINER, reads auth.users). Falls back to the most recent
 * car_listing.contact_email if the RPC returns nothing.
 */
async function resolveUserEmail(userId: string): Promise<string | null> {
  const { data: rpcData } = await supabase.rpc('admin_get_user_emails', {
    _user_ids: [userId],
  });
  const email = (rpcData as Array<{ email: string | null }> | null)?.[0]?.email;
  if (email) return email;

  const { data } = await supabase
    .from('car_listings')
    .select('contact_email')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.contact_email ?? null;
}
