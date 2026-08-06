/**
 * Admin Car-Pass Review — file d'attente de validation des documents Car-Pass.
 * Toute décision passe par la RPC admin_review_car_pass (jamais d'update direct).
 */

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  FileCheck, Clock, ExternalLink, Loader2, CheckCircle, XCircle, ShieldCheck, Building2, User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type TabKey = "pending" | "done" | "all";

interface ListingInfo {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  location: string | null;
  seller_type: string | null;
  contact_name: string | null;
  car_pass_status: string | null;
  car_pass_url: string | null;
  user_id: string;
}

interface QueueRow {
  requestId: string | null;
  listingId: string;
  requestedAt: string | null;
  completedAt: string | null;
  requestStatus: string | null;
  errorMessage: string | null;
  listing: ListingInfo | null;
}

const statusBadge = (status: string | null) => {
  if (status === "verified") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <ShieldCheck className="w-3 h-3 mr-1" />Vérifié
      </Badge>
    );
  }
  if (status === "rejected") {
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Refusé</Badge>;
  }
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-600">
        <Clock className="w-3 h-3 mr-1" />En attente
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-muted-foreground">Non vérifié</Badge>;
};

async function fetchQueue(): Promise<QueueRow[]> {
  const { data: requests, error: reqError } = await sb
    .from("car_pass_verification_requests")
    .select("id, listing_id, requested_by, requested_at, completed_at, status, error_message")
    .order("requested_at", { ascending: false });

  if (reqError) throw reqError;

  // Annonces héritées : car_pass_status = 'pending' sans demande enregistrée
  const { data: orphanListings, error: orphanError } = await sb
    .from("car_listings")
    .select("id")
    .eq("car_pass_status", "pending");

  if (orphanError) throw orphanError;

  const reqRows = (requests ?? []) as Array<{
    id: string; listing_id: string; requested_at: string | null;
    completed_at: string | null; status: string | null; error_message: string | null;
  }>;

  const knownIds = new Set(reqRows.map((r) => r.listing_id));
  const orphanIds = ((orphanListings ?? []) as Array<{ id: string }>)
    .map((l) => l.id)
    .filter((id) => !knownIds.has(id));

  const listingIds = [...new Set([...reqRows.map((r) => r.listing_id), ...orphanIds])];

  let listings: ListingInfo[] = [];
  if (listingIds.length > 0) {
    const { data, error } = await sb
      .from("car_listings")
      .select("id, brand, model, year, price, location, seller_type, contact_name, car_pass_status, car_pass_url, user_id")
      .in("id", listingIds);
    if (error) throw error;
    listings = (data ?? []) as ListingInfo[];
  }

  const byId = new Map(listings.map((l) => [l.id, l]));

  const rows: QueueRow[] = reqRows.map((r) => ({
    requestId: r.id,
    listingId: r.listing_id,
    requestedAt: r.requested_at,
    completedAt: r.completed_at,
    requestStatus: r.status,
    errorMessage: r.error_message,
    listing: byId.get(r.listing_id) ?? null,
  }));

  for (const id of orphanIds) {
    rows.push({
      requestId: null,
      listingId: id,
      requestedAt: null,
      completedAt: null,
      requestStatus: "pending",
      errorMessage: null,
      listing: byId.get(id) ?? null,
    });
  }

  return rows;
}

export default function AdminCarPassPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-car-pass-queue"],
    queryFn: fetchQueue,
  });

  const reviewMutation = useMutation({
    mutationFn: async (vars: { listingId: string; decision: "verified" | "rejected"; note: string | null }) => {
      const { error } = await sb.rpc("admin_review_car_pass", {
        _listing_id: vars.listingId,
        _decision: vars.decision,
        _note: vars.note,
      });
      if (error) throw error;
      return vars.decision;
    },
    onSuccess: (decision) => {
      toast.success(decision === "verified" ? "Car-Pass validé" : "Car-Pass refusé");
      setRejectingId(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-car-pass-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erreur lors de la validation";
      toast.error(message);
    },
  });

  const isPending = (r: QueueRow) =>
    (r.listing?.car_pass_status ?? r.requestStatus) === "pending";

  const filtered = useMemo(() => {
    if (tab === "pending") return rows.filter(isPending);
    if (tab === "done") return rows.filter((r) => !isPending(r));
    return rows;
  }, [rows, tab]);

  const pendingCount = rows.filter(isPending).length;

  const openDocument = async (url: string | null) => {
    if (!url) {
      toast.error("Aucun document Car-Pass fourni");
      return;
    }
    if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener");
      return;
    }
    const { data, error } = await supabase.storage.from("car-pass").createSignedUrl(url, 300);
    if (error || !data?.signedUrl) {
      toast.error("Impossible d'ouvrir le document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const TABS: Array<{ key: TabKey; label: string }> = [
    { key: "pending", label: `En attente${pendingCount ? ` (${pendingCount})` : ""}` },
    { key: "done", label: "Traitées" },
    { key: "all", label: "Toutes" },
  ];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Validation Car-Pass</h1>
          <p className="text-sm text-muted-foreground">
            Contrôle des documents Car-Pass et attribution du badge « Vérifié par AutoRa »
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>
              {tab === "pending"
                ? "Aucune demande en attente"
                : tab === "done"
                  ? "Aucune demande traitée"
                  : "Aucune demande Car-Pass"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const l = row.listing;
            const pending = isPending(row);
            const rowKey = row.requestId ?? row.listingId;
            return (
              <Card key={rowKey} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusBadge(l?.car_pass_status ?? row.requestStatus)}
                        <span className="font-medium text-sm truncate">
                          {l ? `${l.brand} ${l.model} · ${l.year}` : `Annonce ${row.listingId.slice(0, 8)}`}
                        </span>
                      </div>
                      {l && (
                        <p className="text-xs text-muted-foreground">
                          {l.price.toLocaleString("fr-BE")} € {l.location ? `· ${l.location}` : ""}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {l?.seller_type === "professional" ? (
                          <Building2 className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {l?.contact_name ?? "Vendeur inconnu"} ·{" "}
                        {l?.seller_type === "professional" ? "Professionnel" : "Particulier"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Demande du{" "}
                        {row.requestedAt
                          ? format(new Date(row.requestedAt), "d MMM yyyy HH:mm", { locale: fr })
                          : "—"}
                        {row.completedAt &&
                          ` · Traitée le ${format(new Date(row.completedAt), "d MMM yyyy", { locale: fr })}`}
                      </p>
                      {row.errorMessage && (
                        <p className="text-xs text-destructive italic">Motif : {row.errorMessage}</p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => openDocument(l?.car_pass_url ?? null)}>
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Document
                      </Button>
                      {pending && (
                        <>
                          <Button
                            size="sm"
                            disabled={reviewMutation.isPending}
                            onClick={() =>
                              reviewMutation.mutate({ listingId: row.listingId, decision: "verified", note: null })
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectingId(rejectingId === rowKey ? null : rowKey);
                              setNote("");
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Refuser
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {pending && rejectingId === rowKey && (
                    <div className="space-y-2 border-t border-border pt-3">
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Motif du refus (obligatoire)"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setNote(""); }}>
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!note.trim() || reviewMutation.isPending}
                          onClick={() =>
                            reviewMutation.mutate({
                              listingId: row.listingId,
                              decision: "rejected",
                              note: note.trim(),
                            })
                          }
                        >
                          {reviewMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          Confirmer le refus
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
