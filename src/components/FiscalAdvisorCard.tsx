/**
 * Card élégante remplaçant l'estimation fiscale chiffrée.
 * Oriente vers le conseiller fiscal IA contextuel (TaxChatModal).
 */
import { Scale } from "lucide-react";
import { lazy, Suspense } from "react";

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
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card/80 to-primary/5 p-6 sm:p-7 backdrop-blur-sm shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Scale className="w-5 h-5 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-serif text-lg sm:text-xl font-medium text-foreground leading-tight">
            Conseil fiscal personnalisé
          </h3>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mt-1 font-light">
            Assistant IA · 24h/24
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        Chaque situation fiscale est unique — déductibilité, TVA récupérable,
        avantage de toute nature (ATN), taxation régionale (Wallonie · Bruxelles ·
        Flandre)… Notre conseiller fiscal IA analyse votre profil et vous guide
        avec précision pour ce véhicule.
      </p>

      <div className="flex justify-start">
        <Suspense fallback={null}>
          <TaxChatModal vehicle={vehicle} />
        </Suspense>
      </div>
    </div>
  );
}
