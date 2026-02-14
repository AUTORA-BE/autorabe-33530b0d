/**
 * Seller Dashboard — executive-style control panel
 * @module pages
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Eye,
  MessageCircle,
  Heart,
  Car,
  TrendingUp,
  Calendar,
  BarChart3,
  Pencil,
  Trash2,
  Download,
  Plus,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { fr, nl, enGB } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ListingStats {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: string;
  photo: string | null;
  views: number;
  messages: number;
  favorites: number;
  created_at: string;
}

interface DailyStats {
  date: string;
  dateLabel: string;
  views: number;
  messages: number;
  favorites: number;
}

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ListingStats[]>([]);
  const [totals, setTotals] = useState({ views: 0, messages: 0, favorites: 0 });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<ListingStats | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(30);
  const [statusFilter, setStatusFilter] = useState("all");

  const getDateLocale = () => (language === "nl" ? nl : language === "en" ? enGB : fr);
  const getLocaleString = () => (language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => { if (user) fetchStats(); }, [user]);
  useEffect(() => { if (user) fetchDailyStats(chartPeriod); }, [user, chartPeriod, language]);

  // ── Data fetching ────────────────────────────────────────────
  const fetchDailyStats = async (days: number) => {
    if (!user) return;
    try {
      const { data: userListings } = await supabase.from("car_listings").select("id").eq("user_id", user.id);
      if (!userListings?.length) { setDailyStats([]); return; }
      const listingIds = userListings.map(l => l.id);
      const startDate = subDays(new Date(), days);

      const [{ data: viewsData }, { data: conversationsData }, { data: favoritesData }] = await Promise.all([
        supabase.from("car_views").select("viewed_at").in("car_listing_id", listingIds).gte("viewed_at", startDate.toISOString()),
        supabase.from("conversations").select("created_at").eq("seller_id", user.id).in("car_listing_id", listingIds).gte("created_at", startDate.toISOString()),
        supabase.from("favorites").select("created_at").in("car_listing_id", listingIds).gte("created_at", startDate.toISOString()),
      ]);

      const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
      const viewsByDay: Record<string, number> = {};
      const messagesByDay: Record<string, number> = {};
      const favoritesByDay: Record<string, number> = {};

      viewsData?.forEach(v => { const d = format(startOfDay(new Date(v.viewed_at)), "yyyy-MM-dd"); viewsByDay[d] = (viewsByDay[d] || 0) + 1; });
      conversationsData?.forEach(c => { const d = format(startOfDay(new Date(c.created_at)), "yyyy-MM-dd"); messagesByDay[d] = (messagesByDay[d] || 0) + 1; });
      favoritesData?.forEach(f => { const d = format(startOfDay(new Date(f.created_at)), "yyyy-MM-dd"); favoritesByDay[d] = (favoritesByDay[d] || 0) + 1; });

      setDailyStats(allDays.map(day => {
        const k = format(day, "yyyy-MM-dd");
        return { date: k, dateLabel: format(day, "d MMM", { locale: getDateLocale() }), views: viewsByDay[k] || 0, messages: messagesByDay[k] || 0, favorites: favoritesByDay[k] || 0 };
      }));
    } catch (e) { console.error("Error fetching daily stats:", e); }
  };

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: userListings, error } = await supabase.from("car_listings").select("id, brand, model, year, price, status, photos, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      if (!userListings?.length) { setListings([]); setLoading(false); return; }

      const ids = userListings.map(l => l.id);
      const [{ data: viewsData }, { data: favoritesData }, { data: convData }] = await Promise.all([
        supabase.from("car_views").select("car_listing_id").in("car_listing_id", ids),
        supabase.from("favorites").select("car_listing_id").in("car_listing_id", ids),
        supabase.from("conversations").select("car_listing_id").eq("seller_id", user.id).in("car_listing_id", ids),
      ]);

      const count = (data: { car_listing_id: string }[] | null) => {
        const m: Record<string, number> = {};
        data?.forEach(d => { m[d.car_listing_id] = (m[d.car_listing_id] || 0) + 1; });
        return m;
      };
      const vc = count(viewsData), fc = count(favoritesData), mc = count(convData);

      const stats: ListingStats[] = userListings.map(l => ({
        id: l.id, brand: l.brand, model: l.model, year: l.year, price: l.price,
        status: l.status || "pending", photo: l.photos?.[0] || null,
        views: vc[l.id] || 0, messages: mc[l.id] || 0, favorites: fc[l.id] || 0, created_at: l.created_at,
      }));

      setListings(stats);
      setTotals({
        views: stats.reduce((s, l) => s + l.views, 0),
        messages: stats.reduce((s, l) => s + l.messages, 0),
        favorites: stats.reduce((s, l) => s + l.favorites, 0),
      });
    } catch (e) { console.error("Error fetching stats:", e); } finally { setLoading(false); }
  };

  // ── Actions ──────────────────────────────────────────────────
  const handleDeleteClick = (e: React.MouseEvent, listing: ListingStats) => { e.stopPropagation(); setListingToDelete(listing); setDeleteDialogOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("car_listings").delete().eq("id", listingToDelete.id);
      if (error) throw error;
      setListings(prev => prev.filter(l => l.id !== listingToDelete.id));
      toast.success(t("dashboard.deleteSuccess"));
    } catch { toast.error(t("dashboard.deleteError")); } finally { setDeleting(false); setDeleteDialogOpen(false); setListingToDelete(null); }
  };
  const handleEditClick = (e: React.MouseEvent, id: string) => { e.stopPropagation(); navigate(`/sell?edit=${id}`); };

  const formatPrice = (p: number) => new Intl.NumberFormat(getLocaleString(), { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p);
  const formatDate = (d: string) => new Date(d).toLocaleDateString(getLocaleString(), { day: "numeric", month: "short", year: "numeric" });

  const exportToCSV = () => {
    const headers = [t("dashboard.vehicle"), t("dashboard.status"), t("dashboard.price"), t("dashboard.createdAt"), t("dashboard.views"), t("dashboard.messages"), t("dashboard.favorites")];
    const rows = listings.map(l => [`${l.brand} ${l.model} ${l.year}`, l.status === "approved" ? t("dashboard.published") : l.status === "pending" ? t("dashboard.pending") : t("dashboard.rejected"), l.price, formatDate(l.created_at), l.views, l.messages, l.favorites]);
    rows.push([t("dashboard.total"), "", "", "", totals.views, totals.messages, totals.favorites]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `autora-stats-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(t("dashboard.csvDownloaded"));
  };

  const getDaysLabel = (d: number) => language === "en" ? `${d}d` : `${d}j`;

  const statusCounts = {
    all: listings.length,
    approved: listings.filter(l => l.status === "approved").length,
    pending: listings.filter(l => l.status === "pending").length,
    rejected: listings.filter(l => l.status === "rejected").length,
  };

  const filteredListings = statusFilter === "all" ? listings : listings.filter(l => l.status === statusFilter);

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; className: string }> = {
      approved: { label: t("dashboard.published"), className: "bg-primary/10 text-primary" },
      pending: { label: t("dashboard.pending"), className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
      rejected: { label: t("dashboard.rejected"), className: "bg-destructive/10 text-destructive" },
    };
    const info = map[s] || map.pending;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.className}`}>{info.label}</span>;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
        {payload.map((e: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-foreground font-medium">{e.value}</span>
            <span className="text-muted-foreground text-xs">{e.name}</span>
          </div>
        ))}
      </div>
    );
  };

  // ── KPI card helper ──────────────────────────────────────────
  const KpiCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {loading ? <Skeleton className="h-8 w-16" /> : (
          <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
        )}
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* ── Header ──────────────────────────────────── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {t("dashboard.title")}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={exportToCSV} disabled={loading || !listings.length}>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => navigate("/dashboard/stats")}>
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("dashboard.viewStats")}</span>
                </Button>
                <Button size="sm" className="gap-2 rounded-xl" onClick={() => navigate("/sell")}>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("dashboard.createListing")}</span>
                </Button>
              </div>
            </div>

            {/* ── KPI Cards ───────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard icon={Car} label={t("dashboard.listings")} value={listings.length} color="bg-primary/10 text-primary" />
              <KpiCard icon={Eye} label={t("dashboard.totalViews")} value={totals.views} color="bg-blue-500/10 text-blue-500" />
              <KpiCard icon={MessageCircle} label={t("dashboard.messages")} value={totals.messages} color="bg-primary/10 text-primary" />
              <KpiCard icon={Heart} label={t("dashboard.favorites")} value={totals.favorites} color="bg-red-500/10 text-red-500" />
            </div>

            {/* ── Performance Chart ───────────────────────── */}
            <Card className="border-border">
              <div className="flex items-center justify-between p-5 pb-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-foreground text-sm">{t("dashboard.globalPerformance")}</h2>
                </div>
                <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
                  {([7, 30, 90] as const).map(p => (
                    <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartPeriod === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {getDaysLabel(p)}
                    </button>
                  ))}
                </div>
              </div>
              <CardContent className="p-5">
                {loading ? <Skeleton className="h-[240px] w-full rounded-xl" /> : dailyStats.length === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">{t("dashboard.noDataAvailable")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={dailyStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} iconType="circle" iconSize={8} />
                      <Area type="monotone" dataKey="views" name={t("dashboard.views")} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gViews)" />
                      <Line type="monotone" dataKey="messages" name={t("dashboard.messages")} stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="favorites" name={t("dashboard.favorites")} stroke="#ef4444" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Listings Table ──────────────────────────── */}
            <div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-secondary/50 p-1 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      {t("dashboard.all")} ({statusCounts.all})
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      {t("dashboard.published")} ({statusCounts.approved})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      {t("dashboard.pending")} ({statusCounts.pending})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      {t("dashboard.rejected")} ({statusCounts.rejected})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* All tabs render the same filtered list */}
                {["all", "approved", "pending", "rejected"].map(tab => (
                  <TabsContent key={tab} value={tab} className="mt-0">
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[72px] w-full rounded-xl" />)}
                      </div>
                    ) : filteredListings.length === 0 ? (
                      <Card className="border-border">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <Car className="w-10 h-10 text-muted-foreground/40 mb-3" />
                          <p className="text-sm text-muted-foreground mb-4">{t("dashboard.noListingsYet")}</p>
                          <Button size="sm" className="rounded-xl gap-2" onClick={() => navigate("/sell")}>
                            <Plus className="w-4 h-4" />
                            {t("dashboard.createListing")}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {filteredListings.map(listing => (
                          <div
                            key={listing.id}
                            onClick={() => navigate(`/car/${listing.id}`)}
                            className="group flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                          >
                            {/* Thumbnail */}
                            <div className="w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {listing.photo ? (
                                <img src={listing.photo} alt={`${listing.brand} ${listing.model}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Car className="w-5 h-5 text-muted-foreground/50" /></div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-semibold text-sm text-foreground truncate">
                                  {listing.brand} {listing.model}
                                </h3>
                                {statusLabel(listing.status)}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{listing.year}</span>
                                <span className="font-medium text-foreground">{formatPrice(listing.price)}</span>
                                <span className="hidden sm:flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(listing.created_at)}
                                </span>
                              </div>
                            </div>

                            {/* Inline stats */}
                            <div className="hidden md:flex items-center gap-5">
                              <div className="flex items-center gap-1.5 text-blue-500">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-sm font-semibold">{listing.views}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-primary">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="text-sm font-semibold">{listing.messages}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-red-500">
                                <Heart className="w-3.5 h-3.5" />
                                <span className="text-sm font-semibold">{listing.favorites}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleEditClick(e, listing.id)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDeleteClick(e, listing)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/40 hidden md:block" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

          </div>
        </div>
      </main>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deleteListing")}</AlertDialogTitle>
            <AlertDialogDescription>
              {listingToDelete && (
                <>
                  {t("dashboard.deleteConfirm")}{" "}
                  <strong>{listingToDelete.brand} {listingToDelete.model}</strong> ?
                  {" "}{t("dashboard.deleteIrreversible")}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl">{t("dashboard.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              {deleting ? t("dashboard.deleting") : t("dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default SellerDashboard;
