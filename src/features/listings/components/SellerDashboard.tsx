/**
 * SellerDashboard component — executive-style control panel
 * Refactored version with LEZ/Car-Pass badges, DropdownMenu actions, and Framer Motion animations
 * @module features/listings/components
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  MoreHorizontal,
  CheckCircle2,
  Leaf,
  Shield,
  FileCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { fr, nl, enGB } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSellerListings } from "../hooks/useSellerListings";
import type { SellerListing, StatusFilter, ChartPeriod } from "../types/sellerDashboard.types";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/**
 * Check if vehicle is LEZ compatible based on Euro norm and fuel type
 */
function isLezCompatible(euroNorm: string | null, fuelType: string): boolean {
  if (!euroNorm) return false;
  const norm = euroNorm.toLowerCase().replace(/\s/g, "");
  const fuel = fuelType.toLowerCase();
  
  // Electric and plug-in hybrids are always OK
  if (fuel === "électrique" || fuel === "electrique") return true;
  
  // Euro 6d is always OK
  if (norm.includes("euro6d")) return true;
  
  // Euro 6 petrol is OK
  if (norm.includes("euro6") && fuel === "essence") return true;
  
  // Euro 6c diesel is OK for now
  if (norm.includes("euro6c") && fuel === "diesel") return true;
  
  return false;
}

/**
 * KPI Card component with animation
 */
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  loading?: boolean;
}

function KpiCard({ icon: Icon, label, value, color, loading }: KpiCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card border-border hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
          )}
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Main Seller Dashboard component
 */
export default function SellerDashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(30);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<SellerListing | null>(null);

  const getDateLocale = () => (language === "nl" ? nl : language === "en" ? enGB : fr);
  const getLocaleString = () => (language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE");

  const {
    listings,
    totals,
    dailyStats,
    isLoading,
    isLoadingStats,
    deleteListing,
    isDeleting,
    markAsSold,
  } = useSellerListings(chartPeriod, getDateLocale());

  // Status counts
  const statusCounts = useMemo(() => ({
    all: listings.length,
    approved: listings.filter((l) => l.status === "approved").length,
    pending: listings.filter((l) => l.status === "pending").length,
    rejected: listings.filter((l) => l.status === "rejected").length,
    sold: listings.filter((l) => l.status === "sold").length,
  }), [listings]);

  // Filtered listings
  const filteredListings = useMemo(() => 
    statusFilter === "all" ? listings : listings.filter((l) => l.status === statusFilter),
    [listings, statusFilter]
  );

  // Handlers
  const handleDeleteClick = (listing: SellerListing) => {
    setListingToDelete(listing);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (listingToDelete) {
      deleteListing(listingToDelete.id);
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    }
  };

  const handleMarkAsSold = (listingId: string) => {
    markAsSold(listingId);
  };

  // Format helpers
  const formatPrice = (p: number) =>
    new Intl.NumberFormat(getLocaleString(), { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(getLocaleString(), { day: "numeric", month: "short", year: "numeric" });

  const getDaysLabel = (d: number) => (language === "en" ? `${d}d` : `${d}j`);

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      approved: { label: t("dashboard.published"), variant: "default" },
      pending: { label: t("dashboard.pending"), variant: "secondary" },
      rejected: { label: t("dashboard.rejected"), variant: "destructive" },
      sold: { label: t("dashboard.sold") || "Vendu", variant: "outline" },
    };
    const config = configs[status] || configs.pending;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [t("dashboard.vehicle"), t("dashboard.status"), t("dashboard.price"), t("dashboard.createdAt"), t("dashboard.views"), t("dashboard.messages"), t("dashboard.favorites")];
    const rows = listings.map((l) => [
      `${l.brand} ${l.model} ${l.year}`,
      l.status,
      l.price,
      formatDate(l.createdAt),
      l.views,
      l.messages,
      l.favorites,
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autora-stats-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Custom tooltip for chart
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={exportToCSV} disabled={isLoading || !listings.length}>
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
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <KpiCard icon={Car} label={t("dashboard.listings")} value={totals.listings} color="bg-primary/10 text-primary" loading={isLoading} />
        <KpiCard icon={Eye} label={t("dashboard.totalViews")} value={totals.views} color="bg-blue-500/10 text-blue-500" loading={isLoading} />
        <KpiCard icon={MessageCircle} label={t("dashboard.messages")} value={totals.messages} color="bg-primary/10 text-primary" loading={isLoading} />
        <KpiCard icon={Heart} label={t("dashboard.favorites")} value={totals.favorites} color="bg-red-500/10 text-red-500" loading={isLoading} />
      </motion.div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border">
          <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">{t("dashboard.globalPerformance")}</h2>
            </div>
            <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
              {([7, 30, 90] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartPeriod === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {getDaysLabel(p)}
                </button>
              ))}
            </div>
          </div>
          <CardContent className="p-5">
            {isLoadingStats ? (
              <Skeleton className="h-[240px] w-full rounded-xl" />
            ) : dailyStats.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                {t("dashboard.noDataAvailable")}
              </div>
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
      </motion.div>

      {/* Listings Table with Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
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
              <TabsTrigger value="sold" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t("dashboard.sold") || "Vendu"} ({statusCounts.sold})
              </TabsTrigger>
            </TabsList>
          </div>

          {["all", "approved", "pending", "rejected", "sold"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
                  ))}
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
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {filteredListings.map((listing) => (
                    <motion.div
                      key={listing.id}
                      variants={listItemVariants}
                      onClick={() => navigate(`/car/${listing.id}`)}
                      className="group flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {listing.photo ? (
                          <img
                            src={listing.photo}
                            alt={`${listing.brand} ${listing.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-5 h-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {listing.brand} {listing.model}
                          </h3>
                          {renderStatusBadge(listing.status)}
                          
                          {/* LEZ Badge */}
                          {isLezCompatible(listing.euroNorm, listing.fuelType) && (
                            <Badge variant="outline" className="text-xs gap-1 border-green-500/30 text-green-600 dark:text-green-400">
                              <Leaf className="w-3 h-3" />
                              LEZ OK
                            </Badge>
                          )}
                          
                          {/* Car-Pass Badge */}
                          {listing.carPassVerified && (
                            <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-600 dark:text-blue-400">
                              <FileCheck className="w-3 h-3" />
                              Car-Pass
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{listing.year}</span>
                          <span className="font-medium text-foreground">{formatPrice(listing.price)}</span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(listing.createdAt)}
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

                      {/* Actions Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/sell?edit=${listing.id}`);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                              {t("dashboard.edit") || "Modifier"}
                            </DropdownMenuItem>
                            {listing.status === "approved" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsSold(listing.id);
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {t("dashboard.markAsSold") || "Marquer comme vendu"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(listing);
                              }}
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t("dashboard.delete") || "Supprimer"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 hidden md:block" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deleteListing")}</AlertDialogTitle>
            <AlertDialogDescription>
              {listingToDelete && (
                <>
                  {t("dashboard.deleteConfirm")}{" "}
                  <strong>
                    {listingToDelete.brand} {listingToDelete.model}
                  </strong>
                  ? {t("dashboard.deleteIrreversible")}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              {t("dashboard.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isDeleting ? t("dashboard.deleting") : t("dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
