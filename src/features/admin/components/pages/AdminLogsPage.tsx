/**
 * Admin Audit Logs page
 * @module features/admin/components/pages
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { exportData } from '../../utils/exportData';
import type { ExportFormat } from '../../types/admin.types';

export default function AdminLogsPage() {
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: logs = [], isLoading } = useAuditLogs({
    action: actionFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const handleExport = (fmt: ExportFormat) => {
    exportData(logs.map(l => ({
      id: l.id, utilisateur: l.user_name, action: l.action,
      details: l.details ? JSON.stringify(l.details) : '',
      ip: l.ip_hash, date: l.created_at,
    })), 'audit_logs', fmt);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Logs d'activité</h1>
        <Badge variant="secondary">{logs.length}</Badge>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')}><Download className="h-3 w-3 mr-1" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('json')}><Download className="h-3 w-3 mr-1" />JSON</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes actions</SelectItem>
            <SelectItem value="suspend_user">Suspension utilisateur</SelectItem>
            <SelectItem value="unsuspend_user">Réactivation utilisateur</SelectItem>
            <SelectItem value="update_subscription">MAJ abonnement</SelectItem>
            <SelectItem value="approve_listing">Annonce approuvée</SelectItem>
            <SelectItem value="reject_listing">Annonce rejetée</SelectItem>
            <SelectItem value="resolve_report">Signalement traité</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" placeholder="Du" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" placeholder="Au" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-1.5">
          {logs.map(log => (
            <Card key={log.id} className="border-border">
              <CardContent className="p-2.5 flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px] flex-shrink-0">{log.action}</Badge>
                <span className="text-xs text-foreground truncate flex-1">{log.user_name}</span>
                {log.details && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                    {JSON.stringify(log.details).slice(0, 60)}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: fr })}
                </span>
              </CardContent>
            </Card>
          ))}
          {logs.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucun log trouvé</p>}
        </div>
      )}
    </div>
  );
}
