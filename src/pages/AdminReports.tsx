/**
 * Admin Reports & Pending Listings Dashboard
 * @module pages
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, CheckCircle, Clock, Eye, ExternalLink, Filter, Loader2,
  Shield, Trash2, XCircle, Car, Check, X, ImageIcon, History, CalendarIcon,
  Users, Ban, UserCheck, Search,
} from "lucide-react";
import { format } from "date-fns";
import { fr, nl, de, enUS } from "date-fns/locale";

interface Report {
  id: string;
  car_listing_id: string;
  user_id: string;
  reason: string;
  comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  car_brand?: string;
  car_model?: string;
  reporter_name?: string;
  reporter_email?: string;
}

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
}

interface PendingListing {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  location: string | null;
  photos: string[] | null;
  contact_name: string;
  contact_email: string;
  created_at: string;
  status: string;
  seller_type: string | null;
  description: string | null;
}

const AdminReports = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  // Pending listings state
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Admin actions history state
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [actionDateFrom, setActionDateFrom] = useState<string>("");
  const [actionDateTo, setActionDateTo] = useState<string>("");

  // Users management state
  interface AdminUser {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    suspended_at: string | null;
    suspended_reason: string | null;
    created_at: string;
    listing_count?: number;
  }
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const dateLocale = language === "fr" ? fr : language === "nl" ? nl : language === "de" ? de : enUS;

  useEffect(() => { checkAdminAndFetch(); }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: hasAdminRole, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError || !hasAdminRole) {
        toast.error(t("admin.accessDenied"));
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await Promise.all([fetchReports(), fetchPendingListings(), fetchAdminActions(), fetchUsers()]);
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingListings = async () => {
    setPendingLoading(true);
    try {
      const { data, error } = await supabase
        .from("car_listings")
        .select("id, brand, model, year, price, mileage, fuel_type, transmission, location, photos, contact_name, contact_email, created_at, status, seller_type, description")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPendingListings((data || []).map(d => ({ ...d, status: d.status ?? 'pending' })));
    } catch (error) {
      console.error("Error fetching pending listings:", error);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchAdminActions = async () => {
    setActionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const actionsWithNames = await Promise.all(
        (data || []).map(async (action) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", action.admin_id)
            .maybeSingle();
          return {
            ...action,
            metadata: action.metadata as Record<string, unknown> | null,
            admin_name: profile?.display_name || "Admin",
          };
        })
      );
      setAdminActions(actionsWithNames);
    } catch (error) {
      console.error("Error fetching admin actions:", error);
    } finally {
      setActionsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, suspended_at, suspended_reason, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers((data || []).map(p => ({ ...p, listing_count: undefined })));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended_at: new Date().toISOString(), suspended_reason: suspendReason || "Violation des conditions" })
        .eq("user_id", userToSuspend.user_id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.user_id === userToSuspend.user_id ? { ...u, suspended_at: new Date().toISOString(), suspended_reason: suspendReason } : u));
      toast.success("Utilisateur suspendu");
      await logAdminAction("suspend_user", "user", userToSuspend.user_id, suspendReason, { display_name: userToSuspend.display_name });
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Erreur lors de la suspension");
    } finally {
      setActionLoading(false);
      setSuspendDialogOpen(false);
      setUserToSuspend(null);
      setSuspendReason("");
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended_at: null, suspended_reason: null })
        .eq("user_id", userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, suspended_at: null, suspended_reason: null } : u));
      toast.success("Utilisateur réactivé");
      await logAdminAction("unsuspend_user", "user", userId);
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error("Erreur lors de la réactivation");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.display_name?.toLowerCase().includes(q)) || u.user_id.toLowerCase().includes(q);
  });

  const logAdminAction = async (actionType: string, targetType: string, targetId: string, reason?: string, metadata?: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("admin_actions").insert([{
        admin_id: user.id,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        reason: reason || null,
        metadata: (metadata || {}) as Json,
      }]);
    } catch (err) {
      console.error("Failed to log admin action:", err);
    }
  };

  const sendStatusNotification = async (listing: PendingListing, status: "approved" | "rejected") => {
    try {
      await supabase.functions.invoke("notify-listing-status", {
        body: {
          sellerEmail: listing.contact_email,
          sellerName: listing.contact_name,
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          status,
        },
      });
    } catch (err) {
      console.error("Failed to send status notification email:", err);
    }
  };

  const handleApproveListing = async (id: string) => {
    setActionLoading(true);
    try {
      const listing = pendingListings.find(l => l.id === id);
      const { error } = await supabase
        .from("car_listings")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
      setPendingListings(prev => prev.filter(l => l.id !== id));
      toast.success("Annonce approuvée ✓");
      await logAdminAction("approve_listing", "car_listing", id, undefined, listing ? { brand: listing.brand, model: listing.model } : {});
      if (listing) sendStatusNotification(listing, "approved");
    } catch (error) {
      console.error("Error approving listing:", error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectListing = async (id: string) => {
    setActionLoading(true);
    try {
      const listing = pendingListings.find(l => l.id === id);
      const { error } = await supabase
        .from("car_listings")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
      setPendingListings(prev => prev.filter(l => l.id !== id));
      toast.success("Annonce refusée");
      await logAdminAction("reject_listing", "car_listing", id, undefined, listing ? { brand: listing.brand, model: listing.model } : {});
      if (listing) sendStatusNotification(listing, "rejected");
    } catch (error) {
      console.error("Error rejecting listing:", error);
      toast.error("Erreur lors du refus");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    setActionLoading(true);
    try {
      const listing = pendingListings.find(l => l.id === id);
      const { error } = await supabase.from("car_listings").delete().eq("id", id);
      if (error) throw error;
      setPendingListings(prev => prev.filter(l => l.id !== id));
      toast.success("Annonce supprimée");
      await logAdminAction("delete_listing", "car_listing", id, undefined, listing ? { brand: listing.brand, model: listing.model } : {});
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reports logic (unchanged) ────────────────────────────────
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const reportsWithDetails = await Promise.all(
        (data || []).map(async (report) => {
          const [{ data: carData }, { data: profileData }] = await Promise.all([
            supabase.from("car_listings_public").select("brand, model").eq("id", report.car_listing_id).maybeSingle(),
            supabase.from("profiles").select("display_name").eq("user_id", report.user_id).maybeSingle(),
          ]);
          return {
            ...report,
            car_brand: carData?.brand || "Unknown",
            car_model: carData?.model || "Unknown",
            reporter_name: profileData?.display_name ?? undefined,
            reporter_email: report.user_id,
          };
        })
      );
      setReports(reportsWithDetails);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(t("admin.fetchError"));
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from("reports").update({ status: newStatus }).eq("id", reportId);
      if (error) throw error;
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      toast.success(t("admin.statusUpdated"));
      const statusActionMap: Record<string, string> = { resolved: "resolve_report", dismissed: "dismiss_report", reviewed: "review_report" };
      const actionType = statusActionMap[newStatus] || `update_report_${newStatus}`;
      await logAdminAction(actionType, "report", reportId, undefined, { new_status: newStatus } as unknown as Record<string, unknown>);
      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("admin.updateError"));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteReport = async () => {
    if (!reportToDelete) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("reports").delete().eq("id", reportToDelete.id);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== reportToDelete.id));
      toast.success(t("admin.reportDeleted"));
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error(t("admin.deleteError"));
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />{t("admin.pending")}</Badge>;
      case "reviewed": return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Eye className="w-3 h-3 mr-1" />{t("admin.reviewed")}</Badge>;
      case "resolved": return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><CheckCircle className="w-3 h-3 mr-1" />{t("admin.resolved")}</Badge>;
      case "dismissed": return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted"><XCircle className="w-3 h-3 mr-1" />{t("admin.dismissed")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      fake: t("report.reasonFake"), scam: t("report.reasonScam"),
      inappropriate: t("report.reasonInappropriate"), sold: t("report.reasonSold"),
      wrong_info: t("report.reasonWrongInfo"), other: t("report.reasonOther"),
    };
    return reasonMap[reason] || reason;
  };

  const filteredReports = reports.filter(report => {
    if (statusFilter !== "all" && report.status !== statusFilter) return false;
    if (reasonFilter !== "all" && report.reason !== reasonFilter) return false;
    return true;
  });

  const reportStats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    reviewed: reports.filter(r => r.status === "reviewed").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };

  const formatPrice = (p: number) => new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p);

  const actionTypeLabels: Record<string, string> = {
    approve_listing: "Approbation annonce",
    reject_listing: "Refus annonce",
    delete_listing: "Suppression annonce",
    suspend_user: "Suspension utilisateur",
    unsuspend_user: "Réactivation utilisateur",
    resolve_report: "Résolution signalement",
    dismiss_report: "Rejet signalement",
  };

  const uniqueActionTypes = [...new Set(adminActions.map(a => a.action_type))];

  const filteredActions = adminActions.filter(action => {
    if (actionTypeFilter !== "all" && action.action_type !== actionTypeFilter) return false;
    if (actionDateFrom) {
      const from = new Date(actionDateFrom);
      if (new Date(action.created_at) < from) return false;
    }
    if (actionDateTo) {
      const to = new Date(actionDateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(action.created_at) > to) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="page-gradient">
      <SEOHead title={`${t("admin.title")} - AutoRa`} description="Admin dashboard" />
      <Header />

      <main className="min-h-screen pt-16 sm:pt-24 pb-20 sm:pb-12">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <BackButton to="/" className="mb-2" />
              <div className="flex items-center gap-2 mb-0.5">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.subtitle")}</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 mb-4 sm:mb-6">
                <TabsList className="bg-secondary/50 p-0.5 sm:p-1 rounded-xl inline-flex min-w-max">
                  <TabsTrigger value="pending" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Annonces</span>
                    {pendingListings.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                        {pendingListings.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t("admin.reportsList")}</span>
                    {reportStats.pending > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                        {reportStats.pending}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="users" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Utilisateurs</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                      {users.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Historique</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ═══════════════════════════════════════════════ */}
              {/* TAB: Pending Listings                          */}
              {/* ═══════════════════════════════════════════════ */}
              <TabsContent value="pending" className="mt-0">
                {pendingLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : pendingListings.length === 0 ? (
                  <Card className="border-border">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <CheckCircle className="w-10 h-10 text-primary/40 mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">Aucune annonce en attente</p>
                      <p className="text-xs text-muted-foreground mt-1">Toutes les annonces ont été traitées 🎉</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pendingListings.map(listing => (
                      <Card key={listing.id} className="border-border hover:border-primary/20 transition-colors">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="w-20 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {listing.photos?.[0] ? (
                                <img src={listing.photos[0]} alt={`${listing.brand} ${listing.model}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <h3 className="font-semibold text-foreground text-sm">
                                  {listing.brand} {listing.model}
                                </h3>
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                                  En attente
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mb-1.5">
                                <span className="font-semibold text-foreground text-xs">{formatPrice(listing.price)}</span>
                                <span>{listing.year}</span>
                                <span>{listing.mileage.toLocaleString("fr-BE")} km</span>
                                <span className="capitalize">{listing.fuel_type}</span>
                              </div>

                              <div className="text-[10px] text-muted-foreground truncate">
                                👤 {listing.contact_name} · 📅 {format(new Date(listing.created_at), "d MMM", { locale: dateLocale })}
                              </div>
                            </div>
                          </div>

                          {/* Actions row — always visible below on mobile */}
                          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/30">
                            <Button
                              size="sm"
                              className="gap-1 rounded-lg flex-1 h-8 text-xs"
                              onClick={() => handleApproveListing(listing.id)}
                              disabled={actionLoading}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 rounded-lg flex-1 h-8 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleRejectListing(listing.id)}
                              disabled={actionLoading}
                            >
                              <X className="w-3.5 h-3.5" />
                              Refuser
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg flex-shrink-0"
                              onClick={() => window.open(`/car/${listing.id}`, "_blank")}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg text-destructive flex-shrink-0"
                              onClick={() => handleDeleteListing(listing.id)}
                              disabled={actionLoading}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ═══════════════════════════════════════════════ */}
              {/* TAB: Reports                                   */}
              {/* ═══════════════════════════════════════════════ */}
              <TabsContent value="reports" className="mt-0 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Card>
                    <CardHeader className="p-3 sm:pb-2 sm:p-6">
                      <CardDescription className="text-[11px] sm:text-sm">{t("admin.totalReports")}</CardDescription>
                      <CardTitle className="text-lg sm:text-2xl">{reportStats.total}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-amber-500/20">
                    <CardHeader className="p-3 sm:pb-2 sm:p-6">
                      <CardDescription className="flex items-center gap-1 text-[11px] sm:text-sm">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                        {t("admin.pending")}
                      </CardDescription>
                      <CardTitle className="text-lg sm:text-2xl text-amber-600">{reportStats.pending}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-blue-500/20">
                    <CardHeader className="p-3 sm:pb-2 sm:p-6">
                      <CardDescription className="flex items-center gap-1 text-[11px] sm:text-sm">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        {t("admin.reviewed")}
                      </CardDescription>
                      <CardTitle className="text-lg sm:text-2xl text-blue-600">{reportStats.reviewed}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-primary/20">
                    <CardHeader className="p-3 sm:pb-2 sm:p-6">
                      <CardDescription className="flex items-center gap-1 text-[11px] sm:text-sm">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        {t("admin.resolved")}
                      </CardDescription>
                      <CardTitle className="text-lg sm:text-2xl text-primary">{reportStats.resolved}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Filters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      {t("admin.filters")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <div className="w-full sm:w-44">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="rounded-lg"><SelectValue placeholder={t("admin.filterStatus")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
                            <SelectItem value="pending">{t("admin.pending")}</SelectItem>
                            <SelectItem value="reviewed">{t("admin.reviewed")}</SelectItem>
                            <SelectItem value="resolved">{t("admin.resolved")}</SelectItem>
                            <SelectItem value="dismissed">{t("admin.dismissed")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-44">
                        <Select value={reasonFilter} onValueChange={setReasonFilter}>
                          <SelectTrigger className="rounded-lg"><SelectValue placeholder={t("admin.filterReason")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("admin.allReasons")}</SelectItem>
                            <SelectItem value="fake">{t("report.reasonFake")}</SelectItem>
                            <SelectItem value="scam">{t("report.reasonScam")}</SelectItem>
                            <SelectItem value="inappropriate">{t("report.reasonInappropriate")}</SelectItem>
                            <SelectItem value="sold">{t("report.reasonSold")}</SelectItem>
                            <SelectItem value="wrong_info">{t("report.reasonWrongInfo")}</SelectItem>
                            <SelectItem value="other">{t("report.reasonOther")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reports Table */}
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm">{t("admin.reportsList")}</CardTitle>
                    <CardDescription className="text-[11px] sm:text-sm">{filteredReports.length} {t("admin.reportsFound")}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    {filteredReports.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs sm:text-sm">{t("admin.noReports")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredReports.map((report) => (
                          <div key={report.id} className="p-3 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{report.car_brand} {report.car_model}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {format(new Date(report.created_at), "dd MMM yyyy", { locale: dateLocale })} · {report.reporter_name || "Utilisateur"}
                                </p>
                              </div>
                              {getStatusBadge(report.status)}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="text-[10px]">{getReasonLabel(report.reason)}</Badge>
                              <div className="flex gap-1.5">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setSelectedReport(report)}>
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => { setReportToDelete(report); setDeleteDialogOpen(true); }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════ */}
              {/* TAB: Admin Actions History                      */}
              {/* ═══════════════════════════════════════════════ */}
              <TabsContent value="history" className="mt-0 space-y-6">
                {/* Filters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filtres
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <div className="w-full sm:w-48">
                        <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Type d'action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            {uniqueActionTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {actionTypeLabels[type] || type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-auto">
                        <Input
                          type="date"
                          value={actionDateFrom}
                          onChange={(e) => setActionDateFrom(e.target.value)}
                          placeholder="Du"
                          className="rounded-lg w-full sm:w-40"
                        />
                      </div>
                      <div className="w-full sm:w-auto">
                        <Input
                          type="date"
                          value={actionDateTo}
                          onChange={(e) => setActionDateTo(e.target.value)}
                          placeholder="Au"
                          className="rounded-lg w-full sm:w-40"
                        />
                      </div>
                      {(actionTypeFilter !== "all" || actionDateFrom || actionDateTo) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => { setActionTypeFilter("all"); setActionDateFrom(""); setActionDateTo(""); }}
                        >
                          <X className="w-3 h-3 mr-1" /> Réinitialiser
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Historique des actions</CardTitle>
                    <CardDescription>{filteredActions.length} action{filteredActions.length !== 1 ? "s" : ""}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {actionsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : filteredActions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Aucune action trouvée</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Admin</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Cible</TableHead>
                              <TableHead>Raison</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredActions.map((action) => (
                              <TableRow key={action.id}>
                                <TableCell className="whitespace-nowrap text-sm">
                                  {format(new Date(action.created_at), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                                </TableCell>
                                <TableCell className="text-sm">{action.admin_name}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">
                                    {actionTypeLabels[action.action_type] || action.action_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  <span className="text-muted-foreground text-xs">{action.target_type}:</span>{" "}
                                  <span className="font-mono text-xs">{action.target_id.slice(0, 8)}…</span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                  {action.reason || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════ */}
              {/* TAB: Users Management                          */}
              {/* ═══════════════════════════════════════════════ */}
              <TabsContent value="users" className="mt-0 space-y-6">
                {/* Search */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un utilisateur…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 rounded-lg"
                  />
                </div>

                {/* Users Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tous les utilisateurs</CardTitle>
                    <CardDescription>{filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? "s" : ""}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Aucun utilisateur trouvé</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Utilisateur</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Inscrit le</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((u) => (
                              <TableRow key={u.user_id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {u.avatar_url ? (
                                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                        {(u.display_name || "?")[0].toUpperCase()}
                                      </div>
                                    )}
                                    <span className="text-sm font-medium">{u.display_name || "Sans nom"}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{u.user_id.slice(0, 8)}…</TableCell>
                                <TableCell className="text-sm whitespace-nowrap">
                                  {format(new Date(u.created_at), "dd MMM yyyy", { locale: dateLocale })}
                                </TableCell>
                                <TableCell>
                                  {u.suspended_at ? (
                                    <Badge variant="destructive" className="text-xs gap-1">
                                      <Ban className="w-3 h-3" />Suspendu
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/30">
                                      <UserCheck className="w-3 h-3" />Actif
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1.5">
                                    {u.suspended_at ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg gap-1.5 text-primary"
                                        onClick={() => handleUnsuspendUser(u.user_id)}
                                        disabled={actionLoading}
                                      >
                                        <UserCheck className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Réactiver</span>
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg gap-1.5 text-destructive hover:text-destructive"
                                        onClick={() => { setUserToSuspend(u); setSuspendDialogOpen(true); }}
                                        disabled={actionLoading}
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Suspendre</span>
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.reportDetails")}</DialogTitle>
            <DialogDescription>
              {selectedReport && `${selectedReport.car_brand} ${selectedReport.car_model}`}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Signalé par</label>
                <p className="mt-1 text-sm">{selectedReport.reporter_name || "Utilisateur inconnu"}</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedReport.reporter_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("admin.reason")}</label>
                <p className="mt-1">{getReasonLabel(selectedReport.reason)}</p>
              </div>
              {selectedReport.comment && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("admin.comment")}</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedReport.comment}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("admin.currentStatus")}</label>
                <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("admin.changeStatus")}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(["pending", "reviewed", "resolved", "dismissed"] as const).map(s => {
                    const icons = { pending: Clock, reviewed: Eye, resolved: CheckCircle, dismissed: XCircle };
                    const Icon = icons[s];
                    const labels = { pending: t("admin.pending"), reviewed: t("admin.reviewed"), resolved: t("admin.resolved"), dismissed: t("admin.dismissed") };
                    return (
                      <Button key={s} size="sm" variant={selectedReport.status === s ? "default" : "outline"} className="rounded-lg" onClick={() => updateReportStatus(selectedReport.id, s)} disabled={actionLoading}>
                        <Icon className="w-4 h-4 mr-1" />{labels[s]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setSelectedReport(null)}>{t("report.cancel")}</Button>
            {selectedReport && (
              <Button variant="outline" className="rounded-lg" onClick={() => window.open(`/car/${selectedReport.car_listing_id}`, "_blank")}>
                {t("admin.viewListing")} <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Report Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.deleteReport")}</DialogTitle>
            <DialogDescription>{t("admin.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteDialogOpen(false)}>{t("report.cancel")}</Button>
            <Button variant="destructive" className="rounded-lg" onClick={deleteReport} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("dashboard.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Suspendre l'utilisateur</DialogTitle>
            <DialogDescription>
              {userToSuspend?.display_name || "Cet utilisateur"} ne pourra plus accéder aux fonctionnalités.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-muted-foreground">Raison (optionnelle)</label>
            <Input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Ex: Spam, faux annonces, comportement abusif…"
              className="mt-1.5 rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => { setSuspendDialogOpen(false); setUserToSuspend(null); setSuspendReason(""); }}>
              Annuler
            </Button>
            <Button variant="destructive" className="rounded-lg" onClick={handleSuspendUser} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminReports;
