/**
 * Admin dashboard – redirects to /admin/reports
 * Secured by admin role check
 * @module pages
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Car, AlertTriangle, Loader2 } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-gradient flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { title: "Annonces en attente", desc: "Approuver ou rejeter les nouvelles annonces", icon: Car, to: "/admin/reports" },
    { title: "Utilisateurs", desc: "Gérer les comptes et suspensions", icon: Users, to: "/admin/reports" },
    { title: "Signalements", desc: "Examiner les signalements d'annonces", icon: AlertTriangle, to: "/admin/reports" },
  ];

  return (
    <div className="page-gradient">
      <SEOHead title="Administration | AutoRa" description="Tableau de bord d'administration AutoRa" />
      <Header />
      <main className="min-h-screen pt-28 pb-20">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          <div className="flex items-center gap-2.5 mb-5 sm:mb-8">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">Administration</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Tableau de bord AutoRa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {cards.map((card) => (
              <Card
                key={card.title}
                className="cursor-pointer hover:border-primary/30 transition-all hover:shadow-lg"
                onClick={() => navigate(card.to)}
              >
                <CardHeader className="pb-2">
                  <card.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
