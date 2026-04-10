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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Check, X, Trash2, Download, Loader2, CheckCheck } from 'lucide-react';
import { useAdminListings } from '../../hooks/useAdminListings';
import { exportData } from '../../utils/exportData';
import type { ExportFormat } from '../../types/admin.types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  approved: 'bg-emerald-500/10 text-emerald-500',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function AdminListingsPage() {
  const { data: listings = [], isLoading, approve, reject, remove, bulkApprove, isActing } = useAdminListings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; listingId: string | null }>({ open: false, listingId: null });
  const [rejectReason, setRejectReason] = useState('');

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
            <Card key={listing.id} className="border-border">
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
                <div className="flex gap-1 flex-shrink-0">
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
    </div>
  );
}
