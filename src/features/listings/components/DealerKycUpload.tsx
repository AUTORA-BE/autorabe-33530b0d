/**
 * DealerKycUpload — shown in SellerDashboard for professional accounts.
 * Lets dealers upload identity/company documents for DSA Art. 30 KYC.
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, Clock, Upload, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// dealer_kyc is added by a migration; types regen happens via Lovable after deploy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface KycRecord {
  id: string;
  status: "pending" | "verified" | "rejected";
  submitted_at: string | null;
  reviewer_note: string | null;
}

interface Props {
  userId: string;
}

export function DealerKycUpload({ userId }: Props) {
  const [kyc, setKyc] = useState<KycRecord | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchKyc = async () => {
    const { data } = await sb
      .from("dealer_kyc")
      .select("id, status, submitted_at, reviewer_note")
      .eq("user_id", userId)
      .maybeSingle();
    setKyc(data as KycRecord | null);
  };

  useEffect(() => { fetchKyc(); }, [userId]);

  const handleUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WebP ou PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from("dealer-kyc")
        .upload(path, file, { upsert: true });

      if (storageErr) throw storageErr;

      if (kyc) {
        await sb
          .from("dealer_kyc")
          .update({ document_path: path, status: "pending", submitted_at: new Date().toISOString() })
          .eq("id", kyc.id);
      } else {
        await sb.from("dealer_kyc").insert({
          user_id: userId,
          document_path: path,
          status: "pending",
          submitted_at: new Date().toISOString(),
        });
      }

      toast.success("Document soumis — vérification sous 24-48h ouvrables");
      fetchKyc();
    } catch (err) {
      console.error("KYC upload error", err);
      toast.error("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setUploading(false);
    }
  };

  if (kyc === undefined) return null;

  if (kyc?.status === "verified") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Identité vérifiée (KYC)
        </Badge>
      </div>
    );
  }

  if (kyc?.status === "pending") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-600">
        <Clock className="w-3 h-3 mr-1" />
        Vérification KYC en cours…
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      {kyc?.status === "rejected" && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <ShieldAlert className="w-3 h-3 inline mr-1" />
          KYC refusé
          {kyc.reviewer_note && ` — ${kyc.reviewer_note}`}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
      />
      <Button
        size="sm"
        variant={kyc?.status === "rejected" ? "outline" : "default"}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="gap-1.5"
      >
        {uploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : kyc?.status === "rejected" ? (
          <RefreshCcw className="w-3 h-3" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        {kyc?.status === "rejected" ? "Renvoyer le document KYC" : "Soumettre mon KYC (DSA art. 30)"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Carte d'identité, extrait BCE ou numéro de TVA. Max 10 Mo — JPG, PNG, PDF.
      </p>
    </div>
  );
}
