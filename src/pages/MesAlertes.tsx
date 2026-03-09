/**
 * User alerts dashboard page — mobile-first
 * @module pages
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header, Footer } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Plus, TrendingUp } from "lucide-react";
import { useUserAlerts } from "@/features/alerts";
import AlertCard from "@/features/alerts/components/AlertCard";
import SEOHead from "@/components/SEOHead";

export default function MesAlertes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { data: alerts, isLoading } = useUserAlerts();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/auth");
      else setUser(user);
    });
  }, [navigate]);

  if (!user) return null;

  const activeCount = alerts?.filter((a) => a.active).length || 0;
  const pausedCount = alerts?.filter((a) => !a.active).length || 0;
  const totalNotifications = alerts?.reduce((sum, a) => sum + a.match_count, 0) || 0;

  return (
    <div className="page-gradient">
      <SEOHead title="Mes Alertes | AutoRA" description="Gérez vos alertes véhicules et soyez notifié des nouvelles annonces" />
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header — stacks on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                🔔 Mes Alertes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Soyez notifié dès qu'un véhicule correspond à vos critères
              </p>
            </div>
            <Button
              onClick={() => navigate("/mes-alertes/creer")}
              className="rounded-2xl gap-2 w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              Créer une alerte
            </Button>
          </div>

          {/* Stats — horizontal scroll on very small screens */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            {[
              { icon: Bell, label: "Actives", value: activeCount },
              { icon: TrendingUp, label: "Notifs", value: totalNotifications },
              { icon: BellOff, label: "En pause", value: pausedCount },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 p-3 sm:p-4 rounded-2xl border border-border bg-card"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate">{label}</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alerts list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : !alerts?.length ? (
            <div className="flex flex-col items-center text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">Aucune alerte créée</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Créez votre première alerte pour être notifié des nouvelles annonces
              </p>
              <Button
                onClick={() => navigate("/mes-alertes/creer")}
                className="rounded-2xl gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer ma première alerte
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
