import { Info } from "lucide-react";
import { isTestMode } from "@/lib/stripe";
import { paymentsEnabled } from "@/lib/payments";

/** Bandeau affiché tant que les paiements tournent en environnement de test. */
export function PaymentTestModeBanner() {
  if (!paymentsEnabled()) return null;
  if (!isTestMode()) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
      <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
      <span>
        Mode test : aucun paiement réel n'est encaissé. Utilisez la carte
        <strong className="mx-1">4242 4242 4242 4242</strong>
        avec une date future et n'importe quel CVC.
      </span>
    </div>
  );
}
