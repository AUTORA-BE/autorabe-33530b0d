/**
 * Advanced Statistics page for Admin Dashboard
 * @module features/admin/components/pages
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, FunnelChart, Cell } from 'recharts';
import { TrendingUp, Clock, CheckCircle, Users, Crown } from 'lucide-react';
import { useAdminAdvancedStats } from '../../hooks/useAdminAdvancedStats';

const funnelConfig: ChartConfig = {
  count: { label: 'Utilisateurs', color: 'hsl(var(--primary))' },
};

const retentionConfig: ChartConfig = {
  percentage: { label: 'Rétention (%)', color: 'hsl(217, 91%, 60%)' },
};

const FUNNEL_COLORS = [
  'hsl(var(--primary))',
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
];

export default function AdminStatsPage() {
  const { data, isLoading } = useAdminAdvancedStats();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-xl font-bold text-foreground">Statistiques avancées</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Statistiques avancées</h1>
        <Badge variant="secondary" className="text-[10px]">Analytics</Badge>
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.avgListingsPerUser.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Annonces / vendeur</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.approvalRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Taux d'approbation</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.avgTimeToApproval.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">Délai moyen d'approbation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Retention chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Rétention utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.retention.map((bucket) => (
                <div key={bucket.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{bucket.label}</span>
                    <span className="font-medium text-foreground">{bucket.users} utilisateurs ({bucket.percentage}%)</span>
                  </div>
                  <Progress value={bucket.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Entonnoir de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={funnelConfig} className="h-56 w-full">
              <BarChart data={data.funnel} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="step" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value, name, item) => `${value} (${(item as any)?.payload?.rate ?? 0}%)`} />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.funnel.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top sellers */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            Top 10 vendeurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Vendeur</th>
                  <th className="text-center py-2 px-2">Annonces</th>
                  <th className="text-center py-2 px-2">Approuvées</th>
                  <th className="text-center py-2 px-2">Taux</th>
                </tr>
              </thead>
              <tbody>
                {data.topSellers.map((seller, i) => (
                  <tr key={seller.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-2 font-medium text-muted-foreground">
                      {i < 3 ? (
                        <span className={`text-base ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-zinc-400' : 'text-orange-600'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={seller.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {seller.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground truncate max-w-[160px]">{seller.display_name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-foreground">{seller.listing_count}</td>
                    <td className="py-2 px-2 text-center text-emerald-500 font-medium">{seller.approved_count}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={seller.approved_count / seller.listing_count >= 0.8 ? 'default' : 'secondary'} className="text-[10px]">
                        {seller.listing_count ? Math.round((seller.approved_count / seller.listing_count) * 100) : 0}%
                      </Badge>
                    </td>
                  </tr>
                ))}
                {data.topSellers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">Aucun vendeur trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
