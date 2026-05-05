import { Link } from "react-router-dom";
import { Home, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";

const ServerError = () => {
  const { language } = useLanguage();
  const isNl = language === "nl";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <SEOHead
        title={isNl ? "500 — Serverfout | AutoRA.be" : "500 — Erreur serveur | AutoRA.be"}
        description=""
        noindex
      />
      <div className="text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-destructive/10 mb-8">
          <span className="text-5xl font-bold text-destructive font-display">500</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3 font-display">
          {isNl ? "Interne serverfout" : "Erreur interne du serveur"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isNl
            ? "Er is een onverwachte fout opgetreden. Ons team is op de hoogte gesteld. Probeer het later opnieuw."
            : "Une erreur inattendue s'est produite. Notre équipe a été notifiée. Merci de réessayer dans quelques instants."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
            {isNl ? "Opnieuw proberen" : "Réessayer"}
          </Button>
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              {isNl ? "Startpagina" : "Accueil"}
            </Link>
          </Button>
        </div>

        <a
          href="mailto:autoracontact@gmail.com"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="w-4 h-4" />
          {isNl ? "Probleem melden" : "Signaler le problème"}
        </a>

        <p className="mt-10 text-xs text-muted-foreground/40 font-mono">
          HTTP 500 · AutoRA.be
        </p>
      </div>
    </div>
  );
};

export default ServerError;
