/**
 * Seller Dashboard page — wraps the feature component with layout
 * @module pages
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Store, ChevronRight } from "lucide-react";
import { Header, Footer, BackButton } from "@/shared/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import SellerDashboardComponent from "@/features/listings/components/SellerDashboard";
import { DealerKycUpload } from "@/features/listings/components/DealerKycUpload";
import { supabase } from "@/integrations/supabase/client";

const SellerDashboardPage = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // A user is treated as professional if they have a garage_name in profile
    // OR at least one listing with seller_type='professionnel'.
    Promise.all([
      supabase.from("profiles").select("garage_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("car_listings").select("id").eq("user_id", user.id).eq("seller_type", "professionnel").limit(1).maybeSingle(),
    ]).then(([profile, listing]) => {
      if (cancelled) return;
      setIsPro(!!profile.data?.garage_name?.trim() || !!listing.data);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (isLoading || !user) return null;

  return (
    <div className="page-gradient">
      <SEOHead noIndex />
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <BackButton to="/" className="mb-4" />
          <div className="max-w-6xl mx-auto space-y-6">
            {isPro && (
              <Link
                to="/dashboard/vitrine"
                className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 sm:p-5 hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Ma vitrine garage</p>
                  <p className="text-xs text-muted-foreground">Personnalisez la page publique de votre garage (couverture, présentation, services, horaires).</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              </Link>
            )}
            {isPro && (
              <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5">
                <p className="text-sm font-semibold mb-1">Vérification KYC professionnelle (DSA art. 30)</p>
                <p className="text-xs text-muted-foreground mb-3">
                  En tant que vendeur professionnel, vous devez vérifier votre identité.
                  Téléchargez votre extrait BCE, votre carte d'identité ou tout document attestant de votre statut.
                </p>
                <DealerKycUpload userId={user.id} />
              </div>
            )}
            <SellerDashboardComponent />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboardPage;
