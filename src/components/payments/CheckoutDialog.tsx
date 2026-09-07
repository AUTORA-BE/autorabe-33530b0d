import { useCallback, useEffect, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fonction serveur à appeler : abonnement ou boost. */
  functionName: "create-checkout" | "create-boost-checkout";
  /** Clé de tarif lisible (ex. "particulier_monthly", "boost_24h"). */
  priceId: string;
  /** Annonce concernée, pour les boosts. */
  listingId?: string;
  title?: string;
  /** URL de retour après paiement (défaut : page courante avec ?success=true). */
  returnUrl?: string;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  functionName,
  priceId,
  listingId,
  title = "Finaliser votre paiement",
  returnUrl,
}: CheckoutDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const fetchClientSecret = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fallbackReturn = `${window.location.origin}${window.location.pathname}?success=true`;
      const { data, error: fnError } = await supabase.functions.invoke(functionName, {
        body: {
          priceId,
          ...(listingId ? { listingId } : {}),
          returnUrl: returnUrl ?? fallbackReturn,
          environment: getStripeEnvironment(),
        },
      });
      if (fnError) throw fnError;
      if (!data?.clientSecret) throw new Error("Paiement indisponible pour le moment.");
      return data.clientSecret as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de lancer le paiement.");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [functionName, priceId, listingId, returnUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <PaymentTestModeBanner />

        {error ? (
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : (
          <div className="min-h-[420px]">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {open && (
              <EmbeddedCheckoutProvider
                stripe={getStripe()}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
