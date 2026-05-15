/**
 * Fiscal advisor card — redirects to AI tax chat modal.
 * Uses the same Card style as the rest of CarDetail for visual consistency.
 */
import { Scale } from "lucide-react";
import { lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";

const TaxChatModal = lazy(() => import("@/components/TaxChatModal"));

interface FiscalAdvisorCardProps {
  vehicle: {
    brand: string;
    model: string;
    year: number;
    fuelType: string;
    power?: number | null;
    euroNorm?: string | null;
  };
}

export default function FiscalAdvisorCard({ vehicle }: FiscalAdvisorCardProps) {
  return (
    <Card className="border border-border/50 bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
            <Scale className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground leading-tight">
              Conseil fiscal personnalisé
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assistant IA · 24h/24
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Déductibilité, TVA récupérable, avantage de toute nature (ATN),
          taxation régionale (Wallonie · Bruxelles · Flandre)… Notre conseiller
          fiscal IA analyse votre profil pour ce véhicule.
        </p>

        <Suspense fallback={null}>
          <TaxChatModal vehicle={vehicle} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
