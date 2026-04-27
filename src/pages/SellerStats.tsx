import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "@/shared/components";
import { useLocalizedVehicleHref } from "@/lib/useLocalizedHref";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  BarChart3,
  Eye,
  Heart,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Car,
  PieChart,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";
import {   format, subDays, eachDayOfInterval, startOfDay, eachWeekOfInterval, startOfWeek } from "date-fns";
import { fr, nl, enGB } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface ListingStats {
  id: string;
  brand: string;
  model: string;
  year: number;
  views: number;
  favorites: number;
  photo: string | null;
}

interface DailyStats {
  date: string;
  dateLabel: string;
  views: number;
  favorites: number;
}

interface WeeklyStats {
  week: string;
  weekLabel: string;
  views: number;
  favorites: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const SellerStats = () => {
  const navigate = useNavigate();
  const vehicleHref = useLocalizedVehicleHref();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingsStats, setListingsStats] = useState<ListingStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [_weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(30);
  const [totals, setTotals] = useState({ views: 0, favorites: 0, viewsChange: 0, favoritesChange: 0 });

  const getDateLocale = () => {
    return language === "nl" ? nl : language === "en" ? enGB : fr;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
      fetchAllStats();
    }
  }, [user, chartPeriod, language]);

  const fetchAllStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get user's listing IDs first
      const { data: userListings } = await supabase
        .from("car_listings")
        .select("id, brand, model, year, photos")
        .eq("user_id", user.id);

      if (!userListings || userListings.length === 0) {
        setListingsStats([]);
        setDailyStats([]);
        setWeeklyStats([]);
        setTotals({ views: 0, favorites: 0, viewsChange: 0, favoritesChange: 0 });
        setLoading(false);
        return;
      }

      const listingIds = userListings.map(l => l.id);
      const startDate = subDays(new Date(), chartPeriod);
      const previousStartDate = subDays(startDate, chartPeriod);

      // Fetch current period views
      const { data: viewsData } = await supabase
        .from("car_views")
        .select("car_listing_id, viewed_at")
        .in("car_listing_id", listingIds)
        .gte("viewed_at", startDate.toISOString());

      // Fetch previous period views for comparison
      const { data: previousViewsData } = await supabase
        .from("car_views")
        .select("car_listing_id")
        .in("car_listing_id", listingIds)
        .gte("viewed_at", previousStartDate.toISOString())
        .lt("viewed_at", startDate.toISOString());

      // Fetch current period favorites
      const { data: favoritesData } = await supabase
        .from("favorites")
        .select("car_listing_id, created_at")
        .in("car_listing_id", listingIds)
        .gte("created_at", startDate.toISOString());

      // Fetch previous period favorites for comparison
      const { data: previousFavoritesData } = await supabase
        .from("favorites")
        .select("car_listing_id")
        .in("car_listing_id", listingIds)
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      // Calculate totals and changes
      const currentViews = viewsData?.length || 0;
      const previousViews = previousViewsData?.length || 0;
      const currentFavorites = favoritesData?.length || 0;
      const previousFavorites = previousFavoritesData?.length || 0;

      const viewsChange = previousViews > 0 ? Math.round(((currentViews - previousViews) / previousViews) * 100) : 0;
      const favoritesChange = previousFavorites > 0 ? Math.round(((currentFavorites - previousFavorites) / previousFavorites) * 100) : 0;

      setTotals({
        views: currentViews,
        favorites: currentFavorites,
        viewsChange,
        favoritesChange
      });

      // Stats per listing
      const viewsCountByListing: Record<string, number> = {};
      const favoritesCountByListing: Record<string, number> = {};

      viewsData?.forEach(v => {
        viewsCountByListing[v.car_listing_id] = (viewsCountByListing[v.car_listing_id] || 0) + 1;
      });

      favoritesData?.forEach(f => {
        favoritesCountByListing[f.car_listing_id] = (favoritesCountByListing[f.car_listing_id] || 0) + 1;
      });

      const listingStatsData: ListingStats[] = userListings
        .map(listing => ({
          id: listing.id,
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          views: viewsCountByListing[listing.id] || 0,
          favorites: favoritesCountByListing[listing.id] || 0,
          photo: listing.photos?.[0] || null
        }))
        .sort((a, b) => b.views - a.views);

      setListingsStats(listingStatsData);

      // Daily stats
      const allDays = eachDayOfInterval({
        start: startDate,
        end: new Date()
      });

      const viewsByDay: Record<string, number> = {};
      const favoritesByDay: Record<string, number> = {};

      viewsData?.forEach(v => {
        const day = format(startOfDay(new Date(v.viewed_at)), "yyyy-MM-dd");
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;
      });

      favoritesData?.forEach(f => {
        const day = format(startOfDay(new Date(f.created_at)), "yyyy-MM-dd");
        favoritesByDay[day] = (favoritesByDay[day] || 0) + 1;
      });

      const dailyStatsData: DailyStats[] = allDays.map(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        return {
          date: dateKey,
          dateLabel: format(day, "d MMM", { locale: getDateLocale() }),
          views: viewsByDay[dateKey] || 0,
          favorites: favoritesByDay[dateKey] || 0,
        };
      });

      setDailyStats(dailyStatsData);

      // Weekly stats (for longer periods)
      if (chartPeriod >= 30) {
        const allWeeks = eachWeekOfInterval({
          start: startDate,
          end: new Date()
        }, { weekStartsOn: 1 });

        const viewsByWeek: Record<string, number> = {};
        const favoritesByWeek: Record<string, number> = {};

        viewsData?.forEach(v => {
          const week = format(startOfWeek(new Date(v.viewed_at), { weekStartsOn: 1 }), "yyyy-MM-dd");
          viewsByWeek[week] = (viewsByWeek[week] || 0) + 1;
        });

        favoritesData?.forEach(f => {
          const week = format(startOfWeek(new Date(f.created_at), { weekStartsOn: 1 }), "yyyy-MM-dd");
          favoritesByWeek[week] = (favoritesByWeek[week] || 0) + 1;
        });

        const weeklyStatsData: WeeklyStats[] = allWeeks.map(week => {
          const weekKey = format(week, "yyyy-MM-dd");
          return {
            week: weekKey,
            weekLabel: format(week, "d MMM", { locale: getDateLocale() }),
            views: viewsByWeek[weekKey] || 0,
            favorites: favoritesByWeek[weekKey] || 0,
          };
        });

        setWeeklyStats(weeklyStatsData);
      }

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLabel = (days: number) => {
    if (language === "en") return `${days}d`;
    return `${days}j`;
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

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{payload[0].value} {t("stats.views")}</p>
        </div>
      );
    }
    return null;
  };

  const pieData = listingsStats.slice(0, 6).map(l => ({
    name: `${l.brand} ${l.model}`,
    value: l.views
  }));

  return (
    <div className="page-gradient">
      <Header />

      <main className="pt-24">
        <section className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="mb-4 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("stats.backToDashboard")}
              </Button>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <BarChart3 className="w-4 h-4" />
                    {t("stats.analytics")}
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    {t("stats.title")}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {t("stats.subtitle")}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                  {([7, 30, 90] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        chartPeriod === period
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {getDaysLabel(period)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("stats.totalViews")}
                  </CardTitle>
                  <Eye className="w-5 h-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">{totals.views}</div>
                      <div className={`flex items-center gap-1 text-sm mt-1 ${
                        totals.viewsChange >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {totals.viewsChange >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{totals.viewsChange >= 0 ? "+" : ""}{totals.viewsChange}%</span>
                        <span className="text-muted-foreground ml-1">{t("stats.vsPrevious")}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("stats.totalFavorites")}
                  </CardTitle>
                  <Heart className="w-5 h-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">{totals.favorites}</div>
                      <div className={`flex items-center gap-1 text-sm mt-1 ${
                        totals.favoritesChange >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {totals.favoritesChange >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{totals.favoritesChange >= 0 ? "+" : ""}{totals.favoritesChange}%</span>
                        <span className="text-muted-foreground ml-1">{t("stats.vsPrevious")}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Chart */}
            <Card className="bg-card border-border mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Activity className="w-5 h-5 text-primary" />
                  {t("stats.evolution")}
                </CardTitle>
                <CardDescription>{t("stats.evolutionDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : dailyStats.length === 0 ? (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    {t("stats.noData")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFavorites" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                      <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey="views"
                        name={t("stats.views")}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorViews)"
                      />
                      <Area
                        type="monotone"
                        dataKey="favorites"
                        name={t("stats.favorites")}
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorFavorites)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Distribution by vehicle */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <PieChart className="w-5 h-5 text-primary" />
                    {t("stats.viewsDistribution")}
                  </CardTitle>
                  <CardDescription>{t("stats.viewsDistributionDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : pieData.length === 0 || pieData.every(d => d.value === 0) ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      {t("stats.noData")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Bar chart by vehicle */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {t("stats.performanceByVehicle")}
                  </CardTitle>
                  <CardDescription>{t("stats.performanceByVehicleDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : listingsStats.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      {t("stats.noData")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={listingsStats.slice(0, 5).map(l => ({
                          name: `${l.brand} ${l.model}`.substring(0, 12),
                          views: l.views,
                          favorites: l.favorites
                        }))}
                        margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: 30 }} iconType="circle" />
                        <Bar dataKey="views" name={t("stats.views")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="favorites" name={t("stats.favorites")} fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Listings Detail Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Car className="w-5 h-5 text-primary" />
                  {t("stats.detailByVehicle")}
                </CardTitle>
                <CardDescription>{t("stats.detailByVehicleDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : listingsStats.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("stats.noListings")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {listingsStats.map((listing, index) => (
                      <div
                        key={listing.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => navigate(vehicleHref(listing))}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {index + 1}
                        </div>

                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {listing.photo ? (
                            <img
                              src={listing.photo}
                              alt={`${listing.brand} ${listing.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {listing.brand} {listing.model}
                          </h3>
                          <p className="text-sm text-muted-foreground">{listing.year}</p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="flex items-center gap-1.5 text-blue-500">
                              <Eye className="w-4 h-4" />
                              <span className="font-semibold">{listing.views}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{t("stats.views")}</span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1.5 text-red-500">
                              <Heart className="w-4 h-4" />
                              <span className="font-semibold">{listing.favorites}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{t("stats.favorites")}</span>
                          </div>
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

      <Footer />
    </div>
  );
};

export default SellerStats;
