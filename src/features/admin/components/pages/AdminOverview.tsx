/**
 * Admin Overview page with KPIs and charts
 * @module features/admin/components/pages
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Users, Car, AlertTriangle, Clock, MessageSquare, DollarSign, TrendingUp, ShieldAlert } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdminStats';
import { useAdminCharts } from '../../hooks/useAdminCharts';
import { useAdminRealtime } from '../../hooks/useAdminRealtime';
import { OpsAlertsCard } from '../OpsAlertsCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const signupChartConfig: ChartConfig = {
  count: { label: 'Inscriptions', color: 'hsl(var(--primary))' },
};

const listingChartConfig: ChartConfig = {
  count: { label: 'Annonces', color: 'hsl(217, 91%, 60%)' },
};

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Revenus (€)', color: 'hsl(142, 71%, 45%)' },
};

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: charts, isLoading: chartsLoading } = useAdminCharts();
  useAdminRealtime();

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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Vue d'ensemble</h1>
        <Badge variant="secondary" className="text-[10px]">Live</Badge>
      </div>

      {/* Incidents techniques serveur */}
      <OpsAlertsCard />

      {/* KPI cards */}
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

      {/* Charts */}
      {chartsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : charts ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily signups */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Inscriptions (30j)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={signupChartConfig} className="h-48 w-full">
                <AreaChart data={charts.dailySignups} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#signupGrad)" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Weekly listings */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-500" />
                Annonces publiées (12 sem.)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={listingChartConfig} className="h-48 w-full">
                <BarChart data={charts.weeklyListings} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Monthly revenue */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Revenus mensuels (6 mois)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={revenueChartConfig} className="h-48 w-full">
                <LineChart data={charts.monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `€${value}`} />} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(142, 71%, 45%)' }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
