/**
 * Admin dashboard with live stats and quick navigation
 * Secured by admin role check
 * @module pages
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import {  Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, Car, AlertTriangle, Loader2, Clock, _CheckCircle,
  _TrendingUp, _Eye, ArrowRight, Activity, ShieldAlert, _MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  approvedListings: number;
  pendingReports: number;
  totalReports: number;
  suspendedUsers: number;
  recentActions: { action_type: string; created_at: string; target_type: string }[];
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [_isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalListings: 0, pendingListings: 0, approvedListings: 0,
    pendingReports: 0, totalReports: 0, suspendedUsers: 0, recentActions: [],
  });

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      await fetchStats();
      setLoading(false);
    };
    check();
  }, [navigate]);

  const fetchStats = async () => {
    const [profiles, listings, reports, actions] = await Promise.all([
      supabase.from("profiles").select("user_id, suspended_at", { count: "exact", head: false }),
      supabase.from("car_listings").select("id, status", { count: "exact", head: false }),
      supabase.from("reports").select("id, status", { count: "exact", head: false }),
      supabase.from("admin_actions").select("action_type, created_at, target_type").order("created_at", { ascending: false }).limit(5),
    ]);

    const listingsData = listings.data || [];
    const profilesData = profiles.data || [];
    const reportsData = reports.data || [];

    setStats({
      totalUsers: profilesData.length,
      totalListings: listingsData.length,
      pendingListings: listingsData.filter((l: any) => l.status === "pending").length,
      approvedListings: listingsData.filter((l: any) => l.status === "approved").length,
      pendingReports: reportsData.filter((r: any) => r.status === "pending").length,
      totalReports: reportsData.length,
      suspendedUsers: profilesData.filter((p: any) => p.suspended_at !== null).length,
      recentActions: (actions.data || []) as DashboardStats["recentActions"],
    });
  };

  if (loading) {
    return (
      <div className="page-gradient flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const actionLabels: Record<string, string> = {
    approve_listing: "Approbation", reject_listing: "Refus", delete_listing: "Suppression",
    suspend_user: "Suspension", unsuspend_user: "Réactivation", resolve_report: "Résolution",
  };

  const statCards = [
    { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Annonces actives", value: stats.approvedListings, icon: Car, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "En attente", value: stats.pendingListings, icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10", urgent: stats.pendingListings > 0 },
    { label: "Signalements", value: stats.pendingReports, icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10", urgent: stats.pendingReports > 0 },
  ];

  const quickActions = [
    { label: "Modérer annonces", desc: `${stats.pendingListings} en attente`, icon: Car, tab: "pending", urgent: stats.pendingListings > 0 },
    { label: "Signalements", desc: `${stats.pendingReports} à traiter`, icon: AlertTriangle, tab: "reports", urgent: stats.pendingReports > 0 },
    { label: "Utilisateurs", desc: `${stats.suspendedUsers} suspendu${stats.suspendedUsers !== 1 ? "s" : ""}`, icon: Users, tab: "users" },
    { label: "Historique", desc: "Actions admin", icon: Activity, tab: "history" },
  ];

  return (
    <div className="page-gradient">
      <SEOHead title="Administration | AutoRa" description="Tableau de bord d'administration AutoRa" />
      <Header />
      <main className="min-h-screen pt-16 sm:pt-24 pb-24 sm:pb-12">
        <div className="container mx-auto px-3 sm:px-6 max-w-5xl">

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Administration</h1>
              <p className="text-muted-foreground text-[11px] sm:text-sm">Tableau de bord AutoRa</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            {statCards.map((card) => (
              <Card key={card.label} className={`border-border relative overflow-hidden ${card.urgent ? "border-amber-500/40" : ""}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    {card.urgent && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security Overview */}
          <Card className="mb-4 sm:mb-6 border-border">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.suspendedUsers}</p>
                  <p className="text-[10px] text-muted-foreground">Suspendus</p>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.totalReports}</p>
                  <p className="text-[10px] text-muted-foreground">Signalements</p>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.recentActions.length}</p>
                  <p className="text-[10px] text-muted-foreground">Actions récentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
            {quickActions.map((action) => (
              <Card
                key={action.label}
                className={`cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98] ${action.urgent ? "border-amber-500/30" : "border-border"}`}
                onClick={() => navigate(`/admin/reports?tab=${action.tab}`)}
              >
                <CardContent className="p-3 sm:p-4 flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.urgent ? "bg-amber-500/10" : "bg-primary/10"}`}>
                    <action.icon className={`h-4 w-4 ${action.urgent ? "text-amber-500" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card className="border-border">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Activité récente
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 rounded-lg" onClick={() => navigate("/admin/reports?tab=history")}>
                  Tout voir <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {stats.recentActions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune activité récente</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.recentActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {actionLabels[action.action_type] || action.action_type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground truncate flex-1">{action.target_type}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {format(new Date(action.created_at), "dd MMM HH:mm", { locale: fr })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
