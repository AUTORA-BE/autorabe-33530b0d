/**
 * Admin Overview page with KPIs and charts
 * @module features/admin/components/pages
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Users, Car, AlertTriangle, Clock, MessageSquare, DollarSign, TrendingUp, ShieldAlert } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-xl font-bold">Vue d'ensemble</h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Annonces actives', value: stats.approvedListings, icon: Car, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'En attente', value: stats.pendingListings, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', urgent: stats.pendingListings > 0 },
    { label: 'Signalements', value: stats.pendingReports, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', urgent: stats.pendingReports > 0 },
    { label: 'Total annonces', value: stats.totalListings, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Messages aujourd\'hui', value: stats.todayMessages, icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Suspendus', value: stats.suspendedUsers, icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'CA estimé/mois', value: `€${stats.estimatedRevenue}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Vue d'ensemble</h1>
        <Badge variant="secondary" className="text-[10px]">Live</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`border-border ${kpi.urgent ? 'border-amber-500/40' : ''}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                {kpi.urgent && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                )}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
