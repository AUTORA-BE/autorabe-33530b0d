import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  LayoutDashboard, 
  Eye, 
  MessageCircle, 
  Heart, 
  Car,
  TrendingUp,
  Calendar,
  BarChart3,
  Pencil,
  Trash2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ComposedChart
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { fr, nl, enGB } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

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

  const getDateLocale = () => {
    return language === "nl" ? nl : language === "en" ? enGB : fr;
  };

  const getLocaleString = () => {
    return language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE";
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDailyStats(chartPeriod);
    }
  }, [user, chartPeriod, language]);

  const fetchDailyStats = async (days: number) => {
    if (!user) return;

    try {
      // Get user's listing IDs first
      const { data: userListings } = await supabase
        .from("car_listings")
        .select("id")
        .eq("user_id", user.id);

      if (!userListings || userListings.length === 0) {
        setDailyStats([]);
        return;
      }

      const listingIds = userListings.map(l => l.id);
      const startDate = subDays(new Date(), days);

      // Fetch views with dates
      const { data: viewsData } = await supabase
        .from("car_views")
        .select("viewed_at")
        .in("car_listing_id", listingIds)
        .gte("viewed_at", startDate.toISOString());

      // Fetch conversations with dates
      const { data: conversationsData } = await supabase
        .from("conversations")
        .select("created_at")
        .eq("seller_id", user.id)
        .in("car_listing_id", listingIds)
        .gte("created_at", startDate.toISOString());

      // Fetch favorites with dates
      const { data: favoritesData } = await supabase
        .from("favorites")
        .select("created_at")
        .in("car_listing_id", listingIds)
        .gte("created_at", startDate.toISOString());

      // Generate all days in the period
      const allDays = eachDayOfInterval({
        start: startDate,
        end: new Date()
      });

      // Count views, messages and favorites per day
      const viewsByDay: Record<string, number> = {};
      const messagesByDay: Record<string, number> = {};
      const favoritesByDay: Record<string, number> = {};

      viewsData?.forEach(v => {
        const day = format(startOfDay(new Date(v.viewed_at)), "yyyy-MM-dd");
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;
      });

      conversationsData?.forEach(c => {
        const day = format(startOfDay(new Date(c.created_at)), "yyyy-MM-dd");
        messagesByDay[day] = (messagesByDay[day] || 0) + 1;
      });

      favoritesData?.forEach(f => {
        const day = format(startOfDay(new Date(f.created_at)), "yyyy-MM-dd");
        favoritesByDay[day] = (favoritesByDay[day] || 0) + 1;
      });

      // Build daily stats array
      const stats: DailyStats[] = allDays.map(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        return {
          date: dateKey,
          dateLabel: format(day, "d MMM", { locale: getDateLocale() }),
          views: viewsByDay[dateKey] || 0,
          messages: messagesByDay[dateKey] || 0,
          favorites: favoritesByDay[dateKey] || 0,
        };
      });

      setDailyStats(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch user's listings
      const { data: userListings, error: listingsError } = await supabase
        .from("car_listings")
        .select("id, brand, model, year, price, status, photos, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (listingsError) throw listingsError;

      if (!userListings || userListings.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      const listingIds = userListings.map(l => l.id);

      // Fetch views count per listing
      const { data: viewsData } = await supabase
        .from("car_views")
        .select("car_listing_id")
        .in("car_listing_id", listingIds);

      // Fetch favorites count per listing
      const { data: favoritesData } = await supabase
        .from("favorites")
        .select("car_listing_id")
        .in("car_listing_id", listingIds);

      // Fetch conversations (messages) count per listing
      const { data: conversationsData } = await supabase
        .from("conversations")
        .select("car_listing_id")
        .eq("seller_id", user.id)
        .in("car_listing_id", listingIds);

      // Calculate counts per listing
      const viewsCounts: Record<string, number> = {};
      const favoritesCounts: Record<string, number> = {};
      const messagesCounts: Record<string, number> = {};

      viewsData?.forEach(v => {
        viewsCounts[v.car_listing_id] = (viewsCounts[v.car_listing_id] || 0) + 1;
      });

      favoritesData?.forEach(f => {
        favoritesCounts[f.car_listing_id] = (favoritesCounts[f.car_listing_id] || 0) + 1;
      });

      conversationsData?.forEach(c => {
        if (c.car_listing_id) {
          messagesCounts[c.car_listing_id] = (messagesCounts[c.car_listing_id] || 0) + 1;
        }
      });

      // Build listing stats
      const stats: ListingStats[] = userListings.map(listing => ({
        id: listing.id,
        brand: listing.brand,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        status: listing.status || "pending",
        photo: listing.photos?.[0] || null,
        views: viewsCounts[listing.id] || 0,
        messages: messagesCounts[listing.id] || 0,
        favorites: favoritesCounts[listing.id] || 0,
        created_at: listing.created_at,
      }));

      setListings(stats);
      setTotals({
        views: stats.reduce((sum, l) => sum + l.views, 0),
        messages: stats.reduce((sum, l) => sum + l.messages, 0),
        favorites: stats.reduce((sum, l) => sum + l.favorites, 0),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, listing: ListingStats) => {
    e.stopPropagation();
    setListingToDelete(listing);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("car_listings")
        .delete()
        .eq("id", listingToDelete.id);

      if (error) throw error;

      setListings(prev => prev.filter(l => l.id !== listingToDelete.id));
      toast.success(t("dashboard.deleteSuccess"));
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error(t("dashboard.deleteError"));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    navigate(`/sell?edit=${listingId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(getLocaleString(), {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(getLocaleString(), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: "bg-green-500/10 text-green-500",
      pending: "bg-yellow-500/10 text-yellow-500",
      rejected: "bg-red-500/10 text-red-500",
    };
    const labels: Record<string, string> = {
      approved: t("dashboard.published"),
      pending: t("dashboard.pending"),
      rejected: t("dashboard.rejected"),
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const exportToCSV = () => {
    // Headers
    const headers = [
      t("dashboard.vehicle"), 
      t("dashboard.status"), 
      t("dashboard.price"), 
      t("dashboard.createdAt"), 
      t("dashboard.views"), 
      t("dashboard.messages"), 
      t("dashboard.favorites")
    ];
    
    // Rows
    const rows = listings.map(listing => [
      `${listing.brand} ${listing.model} ${listing.year}`,
      listing.status === "approved" ? t("dashboard.published") : listing.status === "pending" ? t("dashboard.pending") : t("dashboard.rejected"),
      listing.price,
      formatDate(listing.created_at),
      listing.views,
      listing.messages,
      listing.favorites
    ]);
    
    // Add totals row
    rows.push([
      t("dashboard.total"),
      "",
      "",
      "",
      totals.views,
      totals.messages,
      totals.favorites
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");
    
    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `statistiques-autora-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(t("dashboard.csvDownloaded"));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getDaysLabel = (days: number) => {
    if (language === "en") return `${days}d`;
    return `${days}j`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        <section className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <LayoutDashboard className="w-4 h-4" />
                  {t("dashboard.sellerArea")}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {t("dashboard.title")}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t("dashboard.subtitle")}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/dashboard/stats")}
                  variant="outline"
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  {t("dashboard.viewStats")}
                </Button>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="gap-2"
                  disabled={loading || listings.length === 0}
                >
                  <Download className="w-4 h-4" />
                  {t("dashboard.exportCSV")}
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.listings")}
                  </CardTitle>
                  <Car className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{listings.length}</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.totalViews")}
                  </CardTitle>
                  <Eye className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{totals.views}</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.messages")}
                  </CardTitle>
                  <MessageCircle className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{totals.messages}</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.favorites")}
                  </CardTitle>
                  <Heart className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{totals.favorites}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Combined Chart */}
            <Card className="bg-card border-border mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {t("dashboard.globalPerformance")}
                </CardTitle>
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                  {([7, 30, 90] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        chartPeriod === period
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {getDaysLabel(period)}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : dailyStats.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {t("dashboard.noDataAvailable")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViewsCombined" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="dateLabel" 
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: 20 }}
                        iconType="circle"
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        name={t("dashboard.views")}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorViewsCombined)"
                      />
                      <Line
                        type="monotone"
                        dataKey="messages"
                        name={t("dashboard.messages")}
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#22c55e" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="favorites"
                        name={t("dashboard.favorites")}
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#ef4444" }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Listings Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5" />
                  {t("dashboard.detailByListing")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t("dashboard.noListingsYet")}
                    </p>
                    <button
                      onClick={() => navigate("/sell")}
                      className="btn-primary-gradient"
                    >
                      {t("dashboard.createListing")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map(listing => (
                      <div
                        key={listing.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => navigate(`/car/${listing.id}`)}
                      >
                        {/* Image */}
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {listing.photo ? (
                            <img
                              src={listing.photo}
                              alt={`${listing.brand} ${listing.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {listing.brand} {listing.model}
                            </h3>
                            {getStatusBadge(listing.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{listing.year}</span>
                            <span>{formatPrice(listing.price)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(listing.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="text-center hidden sm:block">
                            <div className="flex items-center gap-1 text-blue-500">
                              <Eye className="w-4 h-4" />
                              <span className="font-semibold">{listing.views}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{t("dashboard.views")}</span>
                          </div>
                          <div className="text-center hidden sm:block">
                            <div className="flex items-center gap-1 text-green-500">
                              <MessageCircle className="w-4 h-4" />
                              <span className="font-semibold">{listing.messages}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{t("dashboard.messages")}</span>
                          </div>
                          <div className="text-center hidden sm:block">
                            <div className="flex items-center gap-1 text-red-500">
                              <Heart className="w-4 h-4" />
                              <span className="font-semibold">{listing.favorites}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{t("dashboard.favorites")}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg"
                            onClick={(e) => handleEditClick(e, listing.id)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteClick(e, listing)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
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
            <AlertDialogCancel disabled={deleting}>{t("dashboard.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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