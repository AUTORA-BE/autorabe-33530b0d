import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Header, Footer } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Clock, Eye, ExternalLink, Filter, Loader2, Shield, Trash2, XCircle } from "lucide-react";
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

  const dateLocale = language === "fr" ? fr : language === "nl" ? nl : language === "de" ? de : enUS;

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role using the has_role function
      const { data: hasAdminRole, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError || !hasAdminRole) {
        toast.error(t("admin.accessDenied"));
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchReports();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch car details for each report
      const reportsWithCars = await Promise.all(
        (data || []).map(async (report) => {
          const { data: carData } = await supabase
            .from("car_listings_public")
            .select("brand, model")
            .eq("id", report.car_listing_id)
            .maybeSingle();
          
          return {
            ...report,
            car_brand: carData?.brand || "Unknown",
            car_model: carData?.model || "Unknown",
          };
        })
      );

      setReports(reportsWithCars);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(t("admin.fetchError"));
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) throw error;

      setReports(prev => 
        prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
      );
      
      toast.success(t("admin.statusUpdated"));
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
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportToDelete.id);

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
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />{t("admin.pending")}</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Eye className="w-3 h-3 mr-1" />{t("admin.reviewed")}</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />{t("admin.resolved")}</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted"><XCircle className="w-3 h-3 mr-1" />{t("admin.dismissed")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      fake: t("report.reasonFake"),
      scam: t("report.reasonScam"),
      inappropriate: t("report.reasonInappropriate"),
      sold: t("report.reasonSold"),
      wrong_info: t("report.reasonWrongInfo"),
      other: t("report.reasonOther"),
    };
    return reasonMap[reason] || reason;
  };

  const filteredReports = reports.filter(report => {
    if (statusFilter !== "all" && report.status !== statusFilter) return false;
    if (reasonFilter !== "all" && report.reason !== reasonFilter) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    reviewed: reports.filter(r => r.status === "reviewed").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEOHead 
        title={`${t("admin.title")} - AutoRa`}
        description="Admin reports dashboard"
      />
      <Header />
      
      <main className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
            </div>
            <p className="text-muted-foreground">{t("admin.subtitle")}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("admin.totalReports")}</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  {t("admin.pending")}
                </CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-blue-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-blue-500" />
                  {t("admin.reviewed")}
                </CardDescription>
                <CardTitle className="text-3xl text-blue-600">{stats.reviewed}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-green-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {t("admin.resolved")}
                </CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.resolved}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t("admin.filters")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.filterStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
                      <SelectItem value="pending">{t("admin.pending")}</SelectItem>
                      <SelectItem value="reviewed">{t("admin.reviewed")}</SelectItem>
                      <SelectItem value="resolved">{t("admin.resolved")}</SelectItem>
                      <SelectItem value="dismissed">{t("admin.dismissed")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={reasonFilter} onValueChange={setReasonFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.filterReason")} />
                    </SelectTrigger>
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
            <CardHeader>
              <CardTitle>{t("admin.reportsList")}</CardTitle>
              <CardDescription>
                {filteredReports.length} {t("admin.reportsFound")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t("admin.noReports")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.date")}</TableHead>
                        <TableHead>{t("admin.vehicle")}</TableHead>
                        <TableHead>{t("admin.reason")}</TableHead>
                        <TableHead>{t("admin.status")}</TableHead>
                        <TableHead className="text-right">{t("admin.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(report.created_at), "dd MMM yyyy", { locale: dateLocale })}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{report.car_brand} {report.car_model}</div>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-muted-foreground"
                              onClick={() => window.open(`/car/${report.car_listing_id}`, "_blank")}
                            >
                              {t("admin.viewListing")} <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getReasonLabel(report.reason)}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setReportToDelete(report);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
        </div>
      </main>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.reportDetails")}</DialogTitle>
            <DialogDescription>
              {selectedReport && `${selectedReport.car_brand} ${selectedReport.car_model}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("admin.reason")}</label>
                <p className="mt-1">{getReasonLabel(selectedReport.reason)}</p>
              </div>
              
              {selectedReport.comment && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("admin.comment")}</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedReport.comment}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("admin.currentStatus")}</label>
                <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("admin.changeStatus")}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={selectedReport.status === "pending" ? "default" : "outline"}
                    onClick={() => updateReportStatus(selectedReport.id, "pending")}
                    disabled={actionLoading}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    {t("admin.pending")}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReport.status === "reviewed" ? "default" : "outline"}
                    onClick={() => updateReportStatus(selectedReport.id, "reviewed")}
                    disabled={actionLoading}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t("admin.reviewed")}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReport.status === "resolved" ? "default" : "outline"}
                    onClick={() => updateReportStatus(selectedReport.id, "resolved")}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t("admin.resolved")}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReport.status === "dismissed" ? "default" : "outline"}
                    onClick={() => updateReportStatus(selectedReport.id, "dismissed")}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {t("admin.dismissed")}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              {t("report.cancel")}
            </Button>
            {selectedReport && (
              <Button
                variant="outline"
                onClick={() => window.open(`/car/${selectedReport.car_listing_id}`, "_blank")}
              >
                {t("admin.viewListing")} <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.deleteReport")}</DialogTitle>
            <DialogDescription>
              {t("admin.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("report.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteReport}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("dashboard.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default AdminReports;