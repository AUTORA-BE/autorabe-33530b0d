/**
 * Admin KYC Review — DSA Art. 30 dealer identity verification.
 * Lists pending KYC submissions and lets admins approve/reject.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, ShieldAlert, Clock, ExternalLink, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// dealer_kyc is added by a migration; types regen happens via Lovable after deploy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface KycRecord {
  id: string;
  user_id: string;
  status: "pending" | "verified" | "rejected";
  document_path: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_note: string | null;
  created_at: string;
  profiles?: { display_name: string | null; garage_name: string | null };
}

const statusBadge = (status: string) => {
  if (status === "verified") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><ShieldCheck className="w-3 h-3 mr-1" />Vérifié</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Refusé</Badge>;
  return <Badge variant="outline" className="border-amber-500/40 text-amber-600"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
};

export default function AdminKycPage() {
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selected, setSelected] = useState<KycRecord | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    const q = sb
      .from("dealer_kyc")
      .select("*, profiles(display_name, garage_name)")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") q.eq("status", filterStatus);

    const { data, error } = await q;
    if (error) toast.error("Erreur lors du chargement des KYC");
    else setRecords((data ?? []) as KycRecord[]);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [filterStatus]);

  const getDocUrl = async (path: string) => {
    const { data } = await supabase.storage.from("dealer-kyc").createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Impossible d'ouvrir le document");
  };

  const review = async (outcome: "verified" | "rejected") => {
    if (!selected) return;
    setSubmitting(true);
    const { error } = await sb
      .from("dealer_kyc")
      .update({
        status: outcome,
        reviewer_note: note.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success(outcome === "verified" ? "KYC approuvé" : "KYC refusé");
      setSelected(null);
      setNote("");
      fetchRecords();
    }
    setSubmitting(false);
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Vérification KYC — Revendeurs</h1>
          <p className="text-sm text-muted-foreground">DSA Art. 30 — Vérification d'identité des revendeurs professionnels</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["pending", "verified", "rejected", "all"].map((s) => (
          <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)}>
            {s === "pending" ? "En attente" : s === "verified" ? "Vérifiés" : s === "rejected" ? "Refusés" : "Tous"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aucun dossier KYC {filterStatus !== "all" ? `avec le statut « ${filterStatus} »` : ""}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <Card key={rec.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {statusBadge(rec.status)}
                    <span className="font-medium text-sm truncate">
                      {rec.profiles?.garage_name ?? rec.profiles?.display_name ?? rec.user_id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Soumis le {rec.submitted_at ? format(new Date(rec.submitted_at), "d MMM yyyy HH:mm", { locale: fr }) : "—"}
                    {rec.reviewed_at && ` · Traité le ${format(new Date(rec.reviewed_at), "d MMM yyyy", { locale: fr })}`}
                  </p>
                  {rec.reviewer_note && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Note : {rec.reviewer_note}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {rec.document_path && (
                    <Button size="sm" variant="outline" onClick={() => getDocUrl(rec.document_path!)}>
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Document
                    </Button>
                  )}
                  {rec.status === "pending" && (
                    <Button size="sm" onClick={() => { setSelected(rec); setNote(""); }}>
                      Examiner
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Examiner le dossier KYC</DialogTitle>
            <DialogDescription>
              {selected?.profiles?.garage_name ?? selected?.profiles?.display_name ?? selected?.user_id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selected?.document_path && (
              <Button variant="outline" className="w-full" onClick={() => getDocUrl(selected.document_path!)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir le document
              </Button>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Note (optionnelle)</label>
              <Textarea
                placeholder="Raison du refus, demande de complément…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => review("rejected")} disabled={submitting}>
              <XCircle className="w-4 h-4 mr-1" />
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refuser"}
            </Button>
            <Button onClick={() => review("verified")} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="w-4 h-4 mr-1" />
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approuver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
