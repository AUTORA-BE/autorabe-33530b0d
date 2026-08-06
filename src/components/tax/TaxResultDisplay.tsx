/**
 * Affichage d'un `ResultatTaxe` du moteur fiscal belge.
 * Règles :
 *  - `montant === null` → aucun chiffre, on liste les données manquantes et
 *    on renvoie vers le simulateur officiel de la région ;
 *  - `approximatif` → le montant est présenté comme une estimation ;
 *  - `detail[]` est dépliable ;
 *  - la source et la période de validité du barème sont toujours visibles.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BAREME_VALIDE_DEPUIS,
  BAREME_VALIDE_JUSQUAU,
  SIMULATEURS_OFFICIELS,
  baremePerime,
  type Region,
  type ResultatTaxe,
} from "@/lib/belgianTax";
import { formatEur } from "@/lib/belgianTaxHelpers";

interface TaxResultDisplayProps {
  titre: string;
  suffixe?: string;
  region: Region;
  resultat: ResultatTaxe;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-BE");
}

export default function TaxResultDisplay({ titre, suffixe, region, resultat }: TaxResultDisplayProps) {
  const [ouvert, setOuvert] = useState(false);
  const perime = baremePerime();

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{titre}</p>
        {resultat.approximatif && resultat.montant !== null && (
          <Badge variant="secondary" className="text-[10px]">Estimation</Badge>
        )}
      </div>

      {resultat.montant !== null ? (
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {formatEur(resultat.montant)}
          {suffixe && <span className="text-sm font-normal text-muted-foreground">{suffixe}</span>}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Calcul impossible</p>
          <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
            {resultat.donneesManquantes.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <a
            href={SIMULATEURS_OFFICIELS[region]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Simulateur officiel <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {resultat.montant !== null && resultat.donneesManquantes.length > 0 && (
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{resultat.donneesManquantes.join(" · ")}</span>
        </div>
      )}

      {resultat.detail.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            {ouvert ? "Masquer le détail" : "Voir le détail du calcul"}
            {ouvert ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {ouvert && (
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {resultat.detail.map((d, i) => (
                <li key={i} className="font-mono leading-relaxed">{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
        Source : {resultat.source}. Barème valable du {formatDate(BAREME_VALIDE_DEPUIS)} au{" "}
        {formatDate(BAREME_VALIDE_JUSQUAU)}.
      </p>

      {perime && (
        <p className="flex items-start gap-1.5 text-[11px] text-destructive">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          Ce barème est périmé : il est indexé chaque 1er juillet. Vérifiez le simulateur officiel.
        </p>
      )}
    </div>
  );
}
