import SEOHead from "@/components/SEOHead";
import { Header, Footer } from "@/shared/components";
import { Card, CardContent } from "@/components/ui/card";
import { MailX } from "lucide-react";

/**
 * Le désabonnement est désormais géré automatiquement : chaque email applicatif
 * contient un lien de désinscription hébergé qui traite la demande directement.
 * Cette page reste accessible pour les anciens liens.
 */
const Unsubscribe = () => (
  <div className="page-gradient min-h-screen flex flex-col">
    <SEOHead noIndex />
    <Header />
    <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
      <Card className="glass-card max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <MailX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Gestion des désabonnements
          </h1>
          <p className="text-muted-foreground">
            Pour ne plus recevoir nos emails de notification, utilisez le lien de
            désinscription situé en bas de n'importe quel email AutoRA. Votre demande
            est prise en compte immédiatement.
          </p>
        </CardContent>
      </Card>
    </main>
    <Footer />
  </div>
);

export default Unsubscribe;
