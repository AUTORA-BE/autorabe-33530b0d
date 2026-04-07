/**
 * Admin Reports/Signalements management page
 * @module features/admin/components/pages
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CheckCircle, XCircle, Trash2, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminReports } from '../../hooks/useAdminReports';
import { exportData } from '../../utils/exportData';
import type { ExportFormat } from '../../types/admin.types';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'En attente', class: 'bg-amber-500/10 text-amber-500' },
  resolved: { label: 'Résolu', class: 'bg-emerald-500/10 text-emerald-500' },
  dismissed: { label: 'Rejeté', class: 'bg-muted text-muted-foreground' },
};

export default function AdminReportsPage() {
  const { data: reports = [], isLoading, updateStatus, deleteReport, isActing } = useAdminReports();

  const handleExport = (fmt: ExportFormat) => {
    exportData(reports.map(r => ({
      id: r.id, raison: r.reason, commentaire: r.comment, statut: r.status,
      annonce: `${r.car_brand} ${r.car_model}`, signale_par: r.reporter_name, date: r.created_at,
    })), 'signalements', fmt);
  };

  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Signalements</h1>
        <Badge variant="secondary">{reports.length}</Badge>
        {pendingReports.length > 0 && <Badge variant="destructive">{pendingReports.length} en attente</Badge>}
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')}><Download className="h-3 w-3 mr-1" />CSV</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {reports.map(report => {
            const s = STATUS_MAP[report.status] || STATUS_MAP.pending;
            return (
              <Card key={report.id} className={`border-border ${report.status === 'pending' ? 'border-amber-500/30' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge className={`text-[9px] px-1.5 ${s.class}`}>{s.label}</Badge>
                        <span className="text-xs font-medium">{report.car_brand} {report.car_model}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-0.5"><strong>Raison :</strong> {report.reason}</p>
                      {report.comment && <p className="text-xs text-muted-foreground mb-0.5">{report.comment}</p>}
                      <p className="text-[10px] text-muted-foreground">
                        Par {report.reporter_name || 'Anonyme'} · {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {report.status === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => updateStatus({ id: report.id, status: 'resolved' })} disabled={isActing}>
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => updateStatus({ id: report.id, status: 'dismissed' })} disabled={isActing}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (window.confirm('Supprimer ?')) deleteReport(report.id); }} disabled={isActing}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {reports.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucun signalement</p>}
        </div>
      )}
    </div>
  );
}
