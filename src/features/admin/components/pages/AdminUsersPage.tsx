/**
 * Admin Users management page with subscription management
 * @module features/admin/components/pages
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Ban, UserCheck, Download, Loader2, Crown, Edit, UserCog, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { z } from 'zod';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { exportData } from '../../utils/exportData';
import { SUBSCRIPTION_TIERS } from '@/features/subscription/constants/tiers';
import { UserContactCard } from '../UserContactCard';
import { belgianPhoneSchema, belgianPostalSchema, belgianVatSchema, displayNameSchema } from '@/lib/validation/belgian';
import type { ExportFormat } from '../../types/admin.types';
import type { AdminUser } from '../../types/admin.types';

/** Optional-string wrapper around a Zod schema (empty/undefined → pass). */
const optional = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), s.optional());

const profileSchema = z
  .object({
    display_name: optional(displayNameSchema),
    phone: optional(belgianPhoneSchema),
    postal_code: optional(belgianPostalSchema),
    user_type: z.enum(['particulier', 'professionnel']),
    garage_name: optional(z.string().trim().min(2, 'Nom de garage trop court').max(120)),
    bce_number: optional(belgianVatSchema),
  })
  .superRefine((val, ctx) => {
    if (val.user_type === 'professionnel') {
      if (!val.garage_name) {
        ctx.addIssue({ code: 'custom', path: ['garage_name'], message: 'Obligatoire pour un professionnel' });
      }
      if (!val.bce_number) {
        ctx.addIssue({ code: 'custom', path: ['bce_number'], message: 'BCE/TVA obligatoire pour un professionnel' });
      }
    }
  });

type ProfileErrors = Partial<Record<'display_name' | 'phone' | 'postal_code' | 'garage_name' | 'bce_number' | 'user_type', string>>;

/** Map product_id → tier info */
function getTierInfo(productId: string | null, status: string | null) {
  if (!productId || status !== 'active') {
    return { label: 'Gratuit', color: 'bg-muted text-muted-foreground' };
  }
  const tier = Object.values(SUBSCRIPTION_TIERS).find(t => t.product_id === productId);
  if (!tier) return { label: 'Inconnu', color: 'bg-muted text-muted-foreground' };
  if (tier.slug === 'premium') return { label: 'Premium', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' };
  if (tier.slug === 'pro') return { label: 'Pro', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30' };
  return { label: 'Particulier+', color: 'bg-violet-500/15 text-violet-700 border-violet-500/30' };
}

export default function AdminUsersPage() {
  const { data: users = [], isLoading, suspendUser, unsuspendUser, updateSubscription, updateProfile, isActing } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [suspendDialog, setSuspendDialog] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editProductId, setEditProductId] = useState<string>('free');
  const [editEndDate, setEditEndDate] = useState('');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    phone: '',
    garage_name: '',
    bce_number: '',
    postal_code: '',
    user_type: 'particulier' as 'particulier' | 'professionnel',
  });
  const [profileStatus, setProfileStatus] = useState<{ suspended: boolean; reason: string }>({ suspended: false, reason: '' });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.display_name?.toLowerCase().includes(q) || u.user_id.includes(q) || u.phone?.includes(q) || u.garage_name?.toLowerCase().includes(q);
  });

  const handleExport = (fmt: ExportFormat) => {
    exportData(filtered.map(u => {
      const tier = getTierInfo(u.subscription_product_id, u.subscription_status);
      return {
        id: u.user_id,
        nom: u.display_name,
        telephone: u.phone,
        garage: u.garage_name,
        code_postal: u.postal_code,
        statut: u.suspended_at ? 'Suspendu' : 'Actif',
        abonnement: tier.label,
        fin_abonnement: u.subscription_end ? format(new Date(u.subscription_end), 'dd/MM/yyyy') : '-',
        annonces: u.listing_count,
        inscription: u.created_at,
      };
    }), 'utilisateurs', fmt);
  };

  const handleExportUser = (user: AdminUser, fmt: 'csv' | 'json') => {
    const tier = getTierInfo(user.subscription_product_id, user.subscription_status);
    exportData([{
      id: user.user_id,
      nom: user.display_name,
      telephone: user.phone,
      garage: user.garage_name,
      code_postal: user.postal_code,
      statut: user.suspended_at ? 'Suspendu' : 'Actif',
      abonnement: tier.label,
      fin_abonnement: user.subscription_end ? format(new Date(user.subscription_end), 'dd/MM/yyyy') : '-',
      annonces: user.listing_count,
      inscription: user.created_at,
    }], `utilisateur_${user.user_id.slice(0, 8)}`, fmt);
  };

  const openEditModal = (user: AdminUser) => {
    setEditUser(user);
    if (user.subscription_product_id && user.subscription_status === 'active') {
      setEditProductId(user.subscription_product_id);
    } else {
      setEditProductId('free');
    }
    setEditEndDate(user.subscription_end ? new Date(user.subscription_end).toISOString().slice(0, 10) : '');
  };

  const openProfileModal = (user: AdminUser) => {
    setProfileUser(user);
    setProfileErrors({});
    setProfileForm({
      display_name: user.display_name ?? '',
      phone: user.phone ?? '',
      garage_name: user.garage_name ?? '',
      bce_number: '',
      postal_code: user.postal_code ?? '',
      user_type: user.garage_name ? 'professionnel' : 'particulier',
    });
    setProfileStatus({ suspended: !!user.suspended_at, reason: user.suspended_reason ?? '' });
  };

  const handleSaveProfile = () => {
    if (!profileUser) return;
    const parsed = profileSchema.safeParse(profileForm);
    if (!parsed.success) {
      const errs: ProfileErrors = {};
      parsed.error.issues.forEach((iss) => {
        const key = iss.path[0] as keyof ProfileErrors;
        if (key && !errs[key]) errs[key] = iss.message;
      });
      setProfileErrors(errs);
      return;
    }
    setProfileErrors({});
    // Status change first (if any)
    const wasSuspended = !!profileUser.suspended_at;
    if (profileStatus.suspended && !wasSuspended) {
      suspendUser({ userId: profileUser.user_id, reason: profileStatus.reason.trim() || 'Violation des conditions' });
    } else if (!profileStatus.suspended && wasSuspended) {
      unsuspendUser(profileUser.user_id);
    }
    // Profile patch — normalized values from zod
    updateProfile({ userId: profileUser.user_id, patch: parsed.data });
    setProfileUser(null);
  };

  const handleSaveSubscription = () => {
    if (!editUser) return;
    const productId = editProductId === 'free' ? null : editProductId;
    const periodEnd = editEndDate ? new Date(editEndDate).toISOString() : null;
    updateSubscription({ userId: editUser.user_id, productId, periodEnd });
    setEditUser(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
        <Badge variant="secondary">{users.length}</Badge>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')}><Download className="h-3 w-3 mr-1" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('xlsx')}><Download className="h-3 w-3 mr-1" />Excel</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, email, téléphone, garage..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => {
            const tier = getTierInfo(user.subscription_product_id, user.subscription_status);
            return (
              <Card key={user.user_id} className="border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailUserId(user.user_id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                    aria-label={`Voir la fiche de ${user.display_name || 'utilisateur'}`}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="text-xs">{(user.display_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium truncate">{user.display_name || 'Sans nom'}</p>
                        {user.suspended_at && <Badge variant="destructive" className="text-[9px] px-1.5">Suspendu</Badge>}
                        {user.garage_name && <Badge variant="outline" className="text-[9px] px-1.5">Pro</Badge>}
                        <Badge className={`text-[9px] px-1.5 border ${tier.color}`}>{tier.label}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {user.listing_count} annonce{user.listing_count !== 1 ? 's' : ''}
                        {' · '}{format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                        {user.subscription_end && user.subscription_status === 'active' && (
                          <> · Exp. {format(new Date(user.subscription_end), 'dd/MM/yy')}</>
                        )}
                      </p>
                    </div>
                  </button>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openProfileModal(user)} disabled={isActing} title="Modifier le profil">
                      <UserCog className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditModal(user)} disabled={isActing} title="Gérer abonnement">
                      <Crown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportUser(user, 'json')} title="Export RGPD (JSON)">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {user.suspended_at ? (
                      <Button size="sm" variant="outline" onClick={() => unsuspendUser(user.user_id)} disabled={isActing}>
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setSuspendDialog(user.user_id)} disabled={isActing}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucun utilisateur trouvé</p>}
        </div>
      )}

      {/* Suspend dialog */}
      <Dialog open={!!suspendDialog} onOpenChange={() => { setSuspendDialog(null); setSuspendReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre l'utilisateur</DialogTitle>
            <DialogDescription>Indiquez la raison de la suspension.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Raison de la suspension..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => { if (suspendDialog) { suspendUser({ userId: suspendDialog, reason: suspendReason || 'Violation des conditions' }); setSuspendDialog(null); setSuspendReason(''); } }}>
              Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription edit dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-4 w-4" /> Gérer l'abonnement</DialogTitle>
            <DialogDescription>{editUser?.display_name || 'Utilisateur'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Type d'abonnement</label>
              <Select value={editProductId} onValueChange={setEditProductId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuit</SelectItem>
                  {Object.values(SUBSCRIPTION_TIERS).map(t => (
                    <SelectItem key={t.product_id} value={t.product_id}>{t.name} — {t.price}€/mois</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Date de fin</label>
              <Input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Annuler</Button>
            <Button onClick={handleSaveSubscription} disabled={isActing}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit profile dialog (admin can fill missing fields) */}
      <Dialog open={!!profileUser} onOpenChange={() => setProfileUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCog className="h-4 w-4" /> Modifier le profil</DialogTitle>
            <DialogDescription>Compléter ou corriger les informations manquantes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom complet</label>
              <Input value={profileForm.display_name} onChange={e => setProfileForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Nom Prénom" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Téléphone</label>
              <Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+32 ..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Code postal</label>
              <Input value={profileForm.postal_code} onChange={e => setProfileForm(f => ({ ...f, postal_code: e.target.value }))} placeholder="1000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type de compte</label>
              <Select value={profileForm.user_type} onValueChange={(v) => setProfileForm(f => ({ ...f, user_type: v as 'particulier' | 'professionnel' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="professionnel">Professionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {profileForm.user_type === 'professionnel' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nom du garage</label>
                  <Input value={profileForm.garage_name} onChange={e => setProfileForm(f => ({ ...f, garage_name: e.target.value }))} placeholder="Garage XYZ" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">N° BCE / TVA</label>
                  <Input value={profileForm.bce_number} onChange={e => setProfileForm(f => ({ ...f, bce_number: e.target.value }))} placeholder="BE0123456789" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileUser(null)}>Annuler</Button>
            <Button onClick={handleSaveProfile} disabled={isActing}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User contact card (click on row) */}
      <UserContactCard
        userId={detailUserId}
        open={!!detailUserId}
        onOpenChange={(o) => !o && setDetailUserId(null)}
      />
    </div>
  );
}
