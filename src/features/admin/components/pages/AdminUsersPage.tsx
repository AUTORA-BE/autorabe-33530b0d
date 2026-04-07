/**
 * Admin Users management page
 * @module features/admin/components/pages
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Ban, UserCheck, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { exportData } from '../../utils/exportData';
import type { ExportFormat } from '../../types/admin.types';

export default function AdminUsersPage() {
  const { data: users = [], isLoading, suspendUser, unsuspendUser, isActing } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [suspendDialog, setSuspendDialog] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.display_name?.toLowerCase().includes(q) || u.user_id.includes(q) || u.phone?.includes(q) || u.garage_name?.toLowerCase().includes(q);
  });

  const handleExport = (fmt: ExportFormat) => {
    exportData(filtered.map(u => ({
      id: u.user_id,
      nom: u.display_name,
      telephone: u.phone,
      garage: u.garage_name,
      code_postal: u.postal_code,
      statut: u.suspended_at ? 'Suspendu' : 'Actif',
      annonces: u.listing_count,
      inscription: u.created_at,
    })), 'utilisateurs', fmt);
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
        <Input placeholder="Rechercher par nom, email, téléphone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <Card key={user.user_id} className="border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{(user.display_name || '?')[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{user.display_name || 'Sans nom'}</p>
                    {user.suspended_at && <Badge variant="destructive" className="text-[9px] px-1.5">Suspendu</Badge>}
                    {user.garage_name && <Badge variant="outline" className="text-[9px] px-1.5">Pro</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {user.listing_count} annonce{user.listing_count !== 1 ? 's' : ''} · {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
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
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucun utilisateur trouvé</p>}
        </div>
      )}

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
    </div>
  );
}
