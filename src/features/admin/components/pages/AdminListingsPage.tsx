/**
 * Admin Listings management page
 * @module features/admin/components/pages
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Check, X, Trash2, Download, Loader2, CheckCheck, History, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminListings } from '../../hooks/useAdminListings';
import { useListingHistory } from '../../hooks/useListingHistory';
import { exportData } from '../../utils/exportData';
import type { ExportFormat } from '../../types/admin.types';
import type { AdminListing } from '../../types/admin.types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  approved: 'bg-emerald-500/10 text-emerald-500',
  rejected: 'bg-destructive/10 text-destructive',
};

const ACTION_LABELS: Record<string, string> = {
  approve_listing: 'Approuvée',
  reject_listing: 'Rejetée',
  delete_listing: 'Supprimée',
  bulk_approve: 'Approuvée (lot)',
};

export default function AdminListingsPage() {
  const { data: listings = [], isLoading, approve, reject, remove, bulkApprove, isActing } = useAdminListings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; listingId: string | null }>({ open: false, listingId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [detailListing, setDetailListing] = useState<AdminListing | null>(null);

  const { data: history = [], isLoading: historyLoading } = useListingHistory(detailListing?.id ?? null);

  const filtered = listings.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return l.brand.toLowerCase().includes(q) || l.model.toLowerCase().includes(q) || l.contact_name.toLowerCase().includes(q);
  });

  const pendingIds = filtered.filter(l => l.status === 'pending').map(l => l.id);

  const handleExport = (fmt: ExportFormat) => {
    exportData(filtered.map(l => ({
      id: l.id, marque: l.brand, modele: l.model, annee: l.year, prix: l.price,
      km: l.mileage, carburant: l.fuel_type, statut: l.status, vendeur: l.contact_name,
      localisation: l.location, cree_le: l.created_at,
    })), 'annonces', fmt);
  };

  const openRejectDialog = (listingId: string) => {
    setRejectReason('');
    setRejectDialog({ open: true, listingId });
  };

  const confirmReject = () => {
    if (!rejectDialog.listingId || !rejectReason.trim()) return;
    reject({ id: rejectDialog.listingId, reason: rejectReason.trim() });
    setRejectDialog({ open: false, listingId: null });
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Annonces</h1>
        <Badge variant="secondary">{listings.length}</Badge>
        <div className="ml-auto flex gap-1">
          {pendingIds.length > 0 && (
            <Button size="sm" variant="default" onClick={() => bulkApprove(pendingIds)} disabled={isActing}>
              <CheckCheck className="h-3 w-3 mr-1" />Approuver tout ({pendingIds.length})
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')}><Download className="h-3 w-3 mr-1" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('xlsx')}><Download className="h-3 w-3 mr-1" />Excel</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Marque, modèle, vendeur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvées</SelectItem>
            <SelectItem value="rejected">Rejetées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(listing => (
            <Card key={listing.id} className="border-border cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setDetailListing(listing)}>
              <CardContent className="p-3 flex items-center gap-3">
                {listing.photos?.[0] ? (
                  <img src={listing.photos[0]} alt="" className="h-12 w-16 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                ) : (
                  <div className="h-12 w-16 rounded-lg bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{listing.brand} {listing.model}</p>
                    <Badge className={`text-[9px] px-1.5 ${STATUS_COLORS[listing.status || 'pending'] || ''}`}>
                      {listing.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {listing.year} · {listing.mileage?.toLocaleString()} km · €{listing.price?.toLocaleString()} · {listing.contact_name}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {listing.status === 'pending' && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => approve(listing.id)} disabled={isActing}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => openRejectDialog(listing.id)} disabled={isActing}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => { if (window.confirm('Supprimer ?')) remove(listing.id); }} disabled={isActing}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucune annonce trouvée</p>}
        </div>
      )}

      {/* Rejection reason dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) setRejectDialog({ open: false, listingId: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motif de rejet</DialogTitle>
            <DialogDescription>
              Indiquez la raison du rejet. Ce motif sera envoyé au vendeur par email.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex : Photos floues, prix incohérent, informations manquantes..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, listingId: null })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim() || isActing}>
              Rejeter l'annonce
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Listing detail sheet with full buyer-facing preview */}
      <Sheet open={!!detailListing} onOpenChange={(open) => { if (!open) setDetailListing(null); }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {detailListing && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 flex-wrap">
                  {detailListing.brand} {detailListing.model} {detailListing.year}
                  <Badge className={`text-[10px] ${STATUS_COLORS[detailListing.status || 'pending'] || ''}`}>
                    {detailListing.status}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              {/* Photo gallery */}
              {detailListing.photos && detailListing.photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-1.5">
                  {detailListing.photos.map((url: string, i: number) => (
                    <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          Principale
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Price + link */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">€{detailListing.price?.toLocaleString('fr-BE')}</p>
                <a
                  href={`/vehicles/${detailListing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Voir la fiche →
                </a>
              </div>

              {/* All specs */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ["Année", detailListing.year],
                  ["Km", `${detailListing.mileage?.toLocaleString('fr-BE')} km`],
                  ["Carburant", detailListing.fuel_type],
                  ["Boîte", detailListing.transmission],
                  ["Carrosserie", detailListing.body_type],
                  ["Couleur", detailListing.color],
                  ["Puissance", detailListing.power ? `${detailListing.power} ch` : "—"],
                  ["Portes", detailListing.doors],
                  ["Norme Euro", detailListing.euro_norm || "—"],
                  ["Lieu", detailListing.location || "—"],
                  ["Vendeur", detailListing.contact_name],
                  ["Type", detailListing.seller_type],
                  ["CT valide", detailListing.ct_valid ? "✅ Oui" : "❌ Non"],
                  ["Carnet entretien", detailListing.maintenance_book_complete ? "✅ Complet" : "❌ Incomplet"],
                  ["Car-Pass", detailListing.car_pass_verified ? "✅ Vérifié" : "❌ Non"],
                  ["Car-Pass date", detailListing.car_pass_date || "—"],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <span className="text-muted-foreground text-xs">{label} : </span>
                    <span className="font-medium text-xs">{value ?? "—"}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              {detailListing.features && detailListing.features.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {detailListing.features.map((f: string) => (
                    <span key={f} className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20">{f}</span>
                  ))}
                </div>
              )}

              {/* Description */}
              {detailListing.description && (
                <div className="mt-3 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground leading-relaxed">
                  {detailListing.description}
                </div>
              )}

              {/* Car-Pass link — bucket is private, generate a short-lived signed URL on demand */}
              {detailListing.car_pass_url && (
                <button
                  type="button"
                  onClick={async () => {
                    const raw = detailListing.car_pass_url as string;
                    let path = raw;
                    const m = raw.match(/\/storage\/v1\/object\/(?:public|sign)\/car-pass\/(.+?)(?:\?|$)/);
                    if (m) path = m[1];
                    // If a full https URL outside our storage was somehow stored, fall back to opening it.
                    if (/^https?:\/\//i.test(path)) {
                      window.open(path, '_blank', 'noopener,noreferrer');
                      return;
                    }
                    const { supabase } = await import('@/integrations/supabase/client');
                    const { data, error } = await supabase.storage
                      .from('car-pass')
                      .createSignedUrl(path, 60);
                    if (error || !data?.signedUrl) {
                      console.error('car-pass signed url error', error);
                      return;
                    }
                    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="mt-3 flex items-center gap-2 text-xs text-primary underline underline-offset-2"
                >
                  📄 Voir le Car-Pass
                </button>
              )}

              <Separator className="my-4" />

              {/* Action history */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <History className="h-4 w-4 text-primary" />
                  Historique de modération
                </h3>

                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">Aucune action de modération enregistrée.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map(action => {
                      const rejectionReason = action.action_type === 'reject_listing'
                        ? (action.metadata as Record<string, unknown>)?.reason as string | undefined
                        : undefined;

                      return (
                        <div key={action.id} className="rounded-lg border border-border p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`text-[10px] ${action.action_type === 'reject_listing' ? 'border-destructive/30 text-destructive' : action.action_type.includes('approve') ? 'border-emerald-500/30 text-emerald-500' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                              {ACTION_LABELS[action.action_type] || action.action_type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(action.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Par <span className="font-medium text-foreground">{action.admin_name}</span>
                          </p>
                          {rejectionReason && (
                            <div className="flex gap-1.5 items-start mt-1 p-2 rounded-md bg-destructive/5 border border-destructive/10">
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-destructive">{rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
