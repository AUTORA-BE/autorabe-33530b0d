import { useState } from "react";
import { Shield, Leaf, AlertTriangle, Ban, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { calculerStatutLEZ, type LezDetailVille, type LezResultat } from "@/lib/lezData";

interface LezWidgetProps {
  euroNorm?: string | null;
  fuelType?: string;
  compact?: boolean;
}

const statusIcon = (statut: string) => {
  switch (statut) {
    case "interdit": return Ban;
    case "alerte": return AlertTriangle;
    case "derogation_requise": return AlertTriangle;
    case "autorise": return Leaf;
    default: return Info;
  }
};

const statusColors = {
  green: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
    icon: "text-primary",
  },
  orange: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-500",
  },
  gray: {
    bg: "bg-muted/50",
    border: "border-border",
    text: "text-muted-foreground",
    icon: "text-muted-foreground",
  },
};

/** Compact badge for use in cards */
function LezCompactBadge({ result }: { result: LezResultat }) {
  const { global } = result;
  const colors = statusColors[global.couleur];
  const Icon = statusIcon(global.statut);

  const label = global.statut === "autorise"
    ? "LEZ OK"
    : global.statut === "alerte"
      ? `LEZ ${global.anneeInterdiction}`
      : global.statut === "derogation_requise"
        ? "Dérogation"
        : global.statut === "interdit"
          ? "Interdit"
          : "LEZ ?";

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}

/** City detail card */
function VilleCard({ detail }: { detail: LezDetailVille }) {
  const colors = statusColors[detail.couleur];
  const Icon = statusIcon(detail.statut);

  return (
    <div className={`border rounded-xl p-4 ${colors.border} ${colors.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${colors.icon}`} />
        <h4 className="font-semibold capitalize text-foreground">{detail.ville}</h4>
      </div>
      <p className={`text-sm font-medium mb-1 ${colors.text}`}>{detail.message}</p>
      <p className="text-xs text-muted-foreground">{detail.messageDetail}</p>
      {detail.statut === "alerte" && detail.anneesRestantes && (
        <div className="mt-2 pt-2 border-t border-amber-500/20">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            ⚠️ Plus que {detail.anneesRestantes} an{detail.anneesRestantes > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

/** Global alert section */
function LezGlobalAlert({ result }: { result: LezResultat }) {
  const { global } = result;

  if (global.statut === "interdit") {
    return (
      <Alert variant="destructive" className="mb-6">
        <Ban className="h-5 w-5" />
        <AlertTitle>Véhicule interdit</AlertTitle>
        <AlertDescription>
          Ce véhicule est actuellement interdit dans une ou plusieurs zones LEZ belges.
          Amende de 350€ par infraction, contrôles automatiques par caméras.
        </AlertDescription>
      </Alert>
    );
  }

  if (global.statut === "alerte") {
    return (
      <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-300">
          Interdiction prochaine
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          Ce véhicule sera interdit dès <strong>{global.anneeInterdiction}</strong>
          {" "}(dans {global.anneesRestantes} an{(global.anneesRestantes ?? 0) > 1 ? "s" : ""}).
          Revente difficile à l'approche de la date limite, dépréciation accélérée.
          <br /><br />
          💡 <strong>Conseil :</strong> Revendez AVANT {global.anneeInterdiction} pour éviter la chute de valeur.
        </AlertDescription>
      </Alert>
    );
  }

  if (global.statut === "derogation_requise") {
    return (
      <Alert className="mb-6 border-amber-500/30 bg-amber-500/10">
        <Info className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-300">
          Dérogation requise
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          Ce véhicule nécessite une dérogation temporaire (max 8 jours/an, ~35€/dérogation).
          Non adapté pour un usage quotidien.
        </AlertDescription>
      </Alert>
    );
  }

  if (global.statut === "autorise") {
    return (
      <div className="p-4 rounded-xl mb-6 bg-primary/10 border border-primary/30">
        <p className="text-base font-semibold text-primary">
          ✅ Véhicule autorisé dans toutes les zones LEZ belges
        </p>
        <p className="text-sm text-primary/80 mt-1">
          Aucune restriction prévue. Circulation libre.
        </p>
      </div>
    );
  }

  return null;
}

const LezWidget = ({ euroNorm, fuelType, compact = false }: LezWidgetProps) => {
  const [showModal, setShowModal] = useState(false);
  const result = calculerStatutLEZ(fuelType || "", euroNorm || "");
  const colors = statusColors[result.global.couleur];
  const Icon = statusIcon(result.global.statut);

  if (compact) {
    return <LezCompactBadge result={result} />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Global alert */}
        <LezGlobalAlert result={result} />

        {/* City grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.details.map((detail) => (
            <VilleCard key={detail.ville} detail={detail} />
          ))}
        </div>

        {/* Info footer */}
        <div className="flex items-center justify-between pt-2">
          {euroNorm && (
            <p className="text-xs text-muted-foreground">
              Norme : {euroNorm}
            </p>
          )}
          <button
            className="text-primary hover:underline text-sm flex items-center gap-1 ml-auto"
            onClick={() => setShowModal(true)}
          >
            En savoir plus
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Zones de Basses Émissions (LEZ) en Belgique
            </DialogTitle>
            <DialogDescription>
              Réglementation actuelle et prévisions futures
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Bruxelles */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Bruxelles</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="font-medium text-muted-foreground">Norme</div>
                <div className="font-medium text-muted-foreground">Diesel</div>
                <div className="font-medium text-muted-foreground">Essence</div>

                <div>Euro 0-2</div>
                <div className="text-red-600">❌ Interdit</div>
                <div className="text-red-600">❌ Interdit</div>

                <div>Euro 3</div>
                <div className="text-red-600">❌ Interdit</div>
                <div className="text-primary">✅ Autorisé</div>

                <div>Euro 4-5</div>
                <div className="text-red-600">❌ Interdit</div>
                <div className="text-primary">✅ Autorisé</div>

                <div className="font-medium">Euro 6</div>
                <div className="text-amber-600">⚠️ Jusqu'en 2031</div>
                <div className="text-primary">✅ Autorisé</div>

                <div>Euro 6d</div>
                <div className="text-emerald-600">✅ Autorisé</div>
                <div className="text-primary">✅ Autorisé</div>
              </div>
            </div>

            {/* Anvers & Gand */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Anvers & Gand</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="font-medium text-muted-foreground">Norme</div>
                <div className="font-medium text-muted-foreground">Diesel</div>
                <div className="font-medium text-muted-foreground">Essence</div>

                <div>Euro 0-3</div>
                <div className="text-amber-600">⚠️ Dérogation</div>
                <div className="text-primary">✅ Autorisé</div>

                <div>Euro 4+</div>
                <div className="text-emerald-600">✅ Autorisé</div>
                <div className="text-primary">✅ Autorisé</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/10 text-xs text-primary">
              <strong>🔌 Électrique & Hybride :</strong> Toujours autorisé dans toutes les zones.
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => window.open("https://www.lez.brussels/", "_blank")}
              >
                LEZ Bruxelles
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => window.open("https://www.slimnaarantwerpen.be/en/LEZ", "_blank")}
              >
                LEZ Anvers
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LezWidget;
