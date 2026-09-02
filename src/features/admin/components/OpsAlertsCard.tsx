/**
 * Encart "Incidents récents" — 10 derniers incidents techniques serveur.
 * @module features/admin/components
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertOctagon } from 'lucide-react';
import { useOpsAlerts, type OpsAlert } from '../hooks/useOpsAlerts';

const severityVariant: Record<OpsAlert['severity'], 'destructive' | 'secondary' | 'outline'> = {
  critical: 'destructive',
  error: 'destructive',
  warn: 'secondary',
};

export function OpsAlertsCard() {
  const { data: alerts, isLoading } = useOpsAlerts(10);

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertOctagon className="h-4 w-4 text-destructive" strokeWidth={1.5} />
          Incidents récents
          {alerts && alerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">{alerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && (!alerts || alerts.length === 0) && (
          <p className="text-sm text-muted-foreground">
            Aucun incident enregistré — les fonctions serveur tournent normalement.
          </p>
        )}

        {!isLoading &&
          alerts?.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={severityVariant[a.severity]} className="text-[10px] uppercase">
                    {a.severity}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{a.source}</span>
                </div>
                <p className="mt-1 truncate text-sm text-foreground" title={a.message}>
                  {a.message}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString('fr-BE', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
