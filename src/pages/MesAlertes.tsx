/**
 * User alerts dashboard page
 * @module pages
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header, Footer } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Plus, TrendingUp } from "lucide-react";
import { useUserAlerts } from "@/features/alerts";
import AlertCard from "@/features/alerts/components/AlertCard";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";

export default function MesAlertes() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
    <>
      <SEOHead title="Mes Alertes | AutoRA" description="Gérez vos alertes véhicules et soyez notifié des nouvelles annonces" />
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                🔔 Mes Alertes
              </h1>
              <p className="text-muted-foreground">
                Soyez notifié dès qu'un véhicule correspond à vos critères
              </p>
            </div>
            <Button
              onClick={() => navigate("/mes-alertes/creer")}
              className="bg-primary hover:bg-primary/90 rounded-2xl gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Créer une alerte
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Bell, label: "Alertes actives", value: activeCount },
              { icon: TrendingUp, label: "Notifications", value: totalNotifications },
              { icon: BellOff, label: "En pause", value: pausedCount },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label} className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerts list */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : !alerts?.length ? (
            <Card className="rounded-2xl text-center py-16">
              <CardContent>
                <Bell className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <h2 className="text-lg font-bold text-foreground mb-2">Aucune alerte créée</h2>
                <p className="text-muted-foreground mb-6">
                  Créez votre première alerte pour être notifié des nouvelles annonces
                </p>
                <Button
                  onClick={() => navigate("/mes-alertes/creer")}
                  className="bg-primary hover:bg-primary/90 rounded-2xl gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Créer ma première alerte
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
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
