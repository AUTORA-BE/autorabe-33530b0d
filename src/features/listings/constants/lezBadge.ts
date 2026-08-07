/**
 * Source unique de vérité pour le style des badges LEZ.
 * Contrastes validés WCAG AA (≥ 4,5:1) sur texte blanc.
 *
 * @module features/listings/constants/lezBadge
 */

import { Leaf, AlertTriangle, Ban, Info } from "lucide-react";

export const lezBadgeConfig = {
  autorise: { text: "LEZ OK", className: "bg-emerald-700 text-white border-0", Icon: Leaf },
  alerte: { text: "LEZ", className: "bg-amber-700 text-white border-0", Icon: AlertTriangle },
  derogation_requise: { text: "Dérogation", className: "bg-amber-700 text-white border-0", Icon: AlertTriangle },
  interdit: { text: "Interdit", className: "bg-red-700 text-white border-0", Icon: Ban },
  inconnu: { text: "LEZ ?", className: "bg-muted text-muted-foreground border-0", Icon: Info },
} as const;
