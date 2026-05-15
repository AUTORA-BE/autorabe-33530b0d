import { Wrench, Clock, Mail } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const Maintenance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <SEOHead noIndex />
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
          <Wrench className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          Maintenance en cours
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          AutoRA.be is tijdelijk offline voor onderhoud.
        </p>
        <p className="text-muted-foreground mb-8">
          Nous effectuons une mise à jour pour améliorer votre expérience.
          Le site sera de retour très prochainement.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Durée estimée : moins d'une heure</span>
          </div>
          <a
            href="mailto:autoracontact@gmail.com"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Mail className="w-4 h-4" />
            autoracontact@gmail.com
          </a>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/50">
          AutoRA.be — Marketplace automobile belge
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
