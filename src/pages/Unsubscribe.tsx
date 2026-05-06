import { useState, useEffect } from "react";
import { Header, Footer } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();

        if (!res.ok) {
          setStatus("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };

    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  const content: Record<Status, { icon: React.ReactNode; title: string; desc: string }> = {
    loading: {
      icon: <Loader2 className="w-10 h-10 text-primary animate-spin" />,
      title: "Vérification en cours…",
      desc: "Veuillez patienter.",
    },
    valid: {
      icon: <MailX className="w-10 h-10 text-muted-foreground" />,
      title: "Se désabonner",
      desc: "Vous ne recevrez plus d'emails de notification de la part d'AutoRA.",
    },
    already_unsubscribed: {
      icon: <CheckCircle className="w-10 h-10 text-primary" />,
      title: "Déjà désabonné",
      desc: "Vous êtes déjà désabonné de nos emails. Aucune action nécessaire.",
    },
    invalid: {
      icon: <XCircle className="w-10 h-10 text-destructive" />,
      title: "Lien invalide",
      desc: "Ce lien de désinscription est invalide ou a expiré.",
    },
    success: {
      icon: <CheckCircle className="w-10 h-10 text-primary" />,
      title: "Désabonnement confirmé",
      desc: "Vous avez été désabonné avec succès. Vous ne recevrez plus d'emails de notification.",
    },
    error: {
      icon: <XCircle className="w-10 h-10 text-destructive" />,
      title: "Erreur",
      desc: "Une erreur est survenue. Veuillez réessayer plus tard.",
    },
  };

  const c = content[status];

  return (
    <div className="page-gradient min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              {c.icon}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">{c.title}</h1>
            <p className="text-muted-foreground">{c.desc}</p>
            {status === "valid" && (
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                variant="destructive"
                className="mt-4"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement…
                  </>
                ) : (
                  "Confirmer le désabonnement"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
