/**
 * Admin Payments page — Stripe subscriptions + webhook events monitoring
 * Admin-only via RLS (user_roles + has_role). Read-only.
 * @module features/admin/components/pages
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Loader2,
  CreditCard,
  Webhook,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Zap,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SUBSCRIPTION_TIERS } from "@/features/subscription/constants/tiers";
import { UserContactCard } from "../UserContactCard";
import { useAdminListings } from "../../hooks/useAdminListings";

function planLabel(productId: string | null, status: string): string {
  if (!productId || status !== "active") return "Gratuit";
  const t = Object.values(SUBSCRIPTION_TIERS).find(x => x.product_id === productId);
  return t ? t.name : "Inconnu";
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  product_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

interface WebhookEventRow {
  id: string;
  event_id: string;
  event_type: string;
  payload_summary: Record<string, unknown> | null;
  processed_at: string;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "active" || status === "trialing") return "default";
  if (status === "canceled" || status === "incomplete_expired") return "destructive";
  return "secondary";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "active" || status === "trialing")
    return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
  if (status === "canceled" || status === "incomplete_expired")
    return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Clock className="h-3.5 w-3.5 text-amber-500" />;
}

export default function AdminPaymentsPage() {
  const [subSearch, setSubSearch] = useState("");
  const [evtSearch, setEvtSearch] = useState("");
  const [boostSearch, setBoostSearch] = useState("");
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const { data: listings = [], isLoading: boostsLoading } = useAdminListings();

  const { data: subs = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: async (): Promise<SubscriptionRow[]> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "id, user_id, status, product_id, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as SubscriptionRow[];
    },
    staleTime: 60_000,
  });

  const { data: events = [], isLoading: evtLoading } = useQuery({
    queryKey: ["admin", "stripe-events"],
    queryFn: async (): Promise<WebhookEventRow[]> => {
      const { data, error } = await supabase
        .from("stripe_processed_events")
        .select("id, event_id, event_type, payload_summary, processed_at")
        .order("processed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as WebhookEventRow[];
    },
    staleTime: 30_000,
  });

  const filteredSubs = subs.filter((s) => {
    if (!subSearch) return true;
    const q = subSearch.toLowerCase();
    return (
      s.user_id.toLowerCase().includes(q) ||
      (s.stripe_customer_id || "").toLowerCase().includes(q) ||
      (s.stripe_subscription_id || "").toLowerCase().includes(q) ||
      (s.product_id || "").toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  const filteredEvents = events.filter((e) => {
    if (!evtSearch) return true;
    const q = evtSearch.toLowerCase();
    return (
      e.event_type.toLowerCase().includes(q) ||
      e.event_id.toLowerCase().includes(q)
    );
  });

  const activeCount = subs.filter(
    (s) => s.status === "active" || s.status === "trialing"
  ).length;

  const now = Date.now();
  const boosted = (listings || [])
    .filter((l) => l.boost_level !== null && l.boost_level !== undefined)
    .sort((a, b) => {
      const ta = a.boost_expires_at ? new Date(a.boost_expires_at).getTime() : 0;
      const tb = b.boost_expires_at ? new Date(b.boost_expires_at).getTime() : 0;
      const aActive = ta > now ? 1 : 0;
      const bActive = tb > now ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return tb - ta;
    });

  const filteredBoosts = boosted.filter((l) => {
    if (!boostSearch) return true;
    const q = boostSearch.toLowerCase();
    return (
      `${l.brand} ${l.model} ${l.year}`.toLowerCase().includes(q) ||
      (l.boost_level || "").toLowerCase().includes(q)
    );
  });

  const activeBoosts = boosted.filter(
    (l) => l.boost_expires_at && new Date(l.boost_expires_at).getTime() > now
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SidebarTrigger />
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Paiements</h1>
        <Badge variant="secondary" className="ml-2">
          {activeCount} actifs
        </Badge>
        <Badge variant="outline">{events.length} events</Badge>
        <Badge variant="outline" className="border-amber-500/40 text-amber-600">
          {activeBoosts} boosts actifs
        </Badge>
      </div>

      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList>
          <TabsTrigger value="subscriptions">
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Abonnements ({subs.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Webhook className="h-3.5 w-3.5 mr-1.5" />
            Webhook events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="boosts">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Boosts ({boosted.length})
          </TabsTrigger>
        </TabsList>

        {/* SUBSCRIPTIONS */}
        <TabsContent value="subscriptions" className="space-y-3 mt-4">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par user_id, customer, subscription, status..."
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {subsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredSubs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucun abonnement
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredSubs.map((s) => (
                <Card
                  key={s.id}
                  className="border-border hover:border-primary/40 cursor-pointer transition-colors"
                  onClick={() => setDetailUserId(s.user_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetailUserId(s.user_id); }}
                >
                  <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <StatusIcon status={s.status} />
                      <Badge
                        variant={statusVariant(s.status)}
                        className="text-[10px] flex-shrink-0"
                      >
                        {s.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0 border-primary/40 text-primary">
                        {planLabel(s.product_id, s.status)}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground truncate hidden sm:inline">
                        {s.stripe_subscription_id || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-shrink-0">
                      <span className="font-mono truncate max-w-[120px]">
                        user: {s.user_id.slice(0, 8)}…
                      </span>
                      <span>
                        {s.current_period_end
                          ? `renouv. ${format(new Date(s.current_period_end), "dd/MM/yy", { locale: fr })}`
                          : "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* WEBHOOK EVENTS */}
        <TabsContent value="events" className="space-y-3 mt-4">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par event_type ou event_id..."
              value={evtSearch}
              onChange={(e) => setEvtSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {evtLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucun événement webhook
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredEvents.map((e) => (
                <Card key={e.id} className="border-border">
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="text-[10px]">
                        {e.event_type}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0">
                        {e.event_id}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {format(new Date(e.processed_at), "dd MMM HH:mm:ss", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    {e.payload_summary && (
                      <pre className="text-[10px] text-muted-foreground bg-secondary/40 p-2 rounded overflow-x-auto max-h-24">
                        {JSON.stringify(e.payload_summary, null, 2).slice(0, 400)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UserContactCard
        userId={detailUserId}
        open={!!detailUserId}
        onOpenChange={(o) => !o && setDetailUserId(null)}
      />
    </div>
  );
}
