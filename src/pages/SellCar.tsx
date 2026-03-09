import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { SellCarForm } from "@/components/SellCarForm";
import type { SellCarFormWatchData } from "@/components/SellCarForm";
import ListingPreview from "@/components/ListingPreview";
import { Button } from "@/components/ui/button";
import { Car, Shield, Clock, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SellCar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { t } = useLanguage();

  // Live preview state
  const [previewData, setPreviewData] = useState<SellCarFormWatchData>({});
  const [previewPhoto, setPreviewPhoto] = useState<string | undefined>();
  const [previewPhotoCount, setPreviewPhotoCount] = useState(0);

  const handleFormDataChange = useCallback(
    (data: SellCarFormWatchData, photoPreview: string | undefined, photoCount: number) => {
      setPreviewData(data);
      setPreviewPhoto(photoPreview);
      setPreviewPhotoCount(photoCount);
    },
    [],
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="page-gradient">
      <SEOHead 
        title={editId ? t("sell.editTitle") : t("sell.title")}
        description="Publiez votre annonce automobile en quelques minutes sur AutoRa et touchez des milliers d'acheteurs en Belgique."
        url="https://autora.be/sell"
      />
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {editId ? t("sell.editTitle") : t("sell.title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {editId ? t("sell.editSubtitle") : t("sell.subtitle")}
            </p>
          </div>

          {!isAuthenticated ? (
            /* Login CTA */
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
                <Car className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {t("sell.loginToSell")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {t("sell.loginDesc")}
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col items-center">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">{t("sell.secureListings")}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clock className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">{t("sell.quickPublish")}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">{t("sell.carpassVerification")}</span>
                  </div>
                </div>
                
                <Button size="lg" onClick={() => navigate("/auth")} className="min-w-[200px]">
                  {t("sell.loginSignup")}
                </Button>
              </div>
            </div>
          ) : (
            /* Form + Live Preview side-by-side */
            <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
              {/* Mobile preview (top) */}
              <div className="lg:hidden">
                <ListingPreview
                  data={previewData}
                  photoPreview={previewPhoto}
                  photoCount={previewPhotoCount}
                />
              </div>

              {/* Form */}
              <div className="flex-1 min-w-0">
                <SellCarForm
                  editId={editId || undefined}
                  onFormDataChange={handleFormDataChange}
                />
              </div>

              {/* Desktop sticky preview (right) */}
              <div className="hidden lg:block w-[340px] shrink-0">
                <div className="sticky top-28">
                  <ListingPreview
                    data={previewData}
                    photoPreview={previewPhoto}
                    photoCount={previewPhotoCount}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
