import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { prefetchCriticalRoutes } from "@/utils/prefetchRoutes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CompareProvider } from "@/features/compare";
import { LanguageProvider } from "@/contexts/LanguageContext";
import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
const CompareBar = lazy(() => import("@/features/compare/components/CompareBar"));
const BottomNav = lazy(() => import("@/shared/components/BottomNav"));
const CarChatbot = lazy(() => import("@/components/CarChatbot"));
const PWAInstallBanner = lazy(() => import("@/components/PWAInstallBanner"));

// Lazy-loaded — reduces main bundle unused JS
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy-loaded pages for reduced initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const CarDetail = lazy(() => import("./pages/CarDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const SellCar = lazy(() => import("./pages/SellCar"));
const Messages = lazy(() => import("./pages/Messages"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Compare = lazy(() => import("./pages/Compare"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerStats = lazy(() => import("./pages/SellerStats"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Legal = lazy(() => import("./pages/Legal"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const Admin = lazy(() => import("./pages/Admin"));
const CalculateurTCO = lazy(() => import("./pages/CalculateurTCO"));
const MesAlertes = lazy(() => import("./pages/MesAlertes"));
const CreerAlerte = lazy(() => import("./pages/CreerAlerte"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));

/** Minimal loading fallback shown while lazy chunks load */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

/**
 * React Query client configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Scroll to top on route change + trigger idle prefetching once */
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);
  return null;
}

/** Routes wrapper — no AnimatePresence to reduce style/layout cost */
function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/car/:id" element={<PageTransition><CarDetail /></PageTransition>} />
        <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
        <Route path="/sell" element={<PageTransition><SellCar /></PageTransition>} />
        <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><SellerDashboard /></PageTransition>} />
        <Route path="/dashboard/stats" element={<PageTransition><SellerStats /></PageTransition>} />
        <Route path="/admin/reports" element={<PageTransition><AdminReports /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/legal" element={<PageTransition><Legal /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/calculateur-tco" element={<PageTransition><CalculateurTCO /></PageTransition>} />
        <Route path="/mes-alertes" element={<PageTransition><MesAlertes /></PageTransition>} />
        <Route path="/mes-alertes/creer" element={<PageTransition><CreerAlerte /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
        <Route path="/payment-canceled" element={<PageTransition><PaymentCanceled /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CompareProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <ScrollToTopOnNavigate />
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </Suspense>
              <ScrollToTop />
              <Suspense fallback={null}><BottomNav /></Suspense>
              <Suspense fallback={null}><CompareBar /></Suspense>
              <Suspense fallback={null}><CarChatbot /></Suspense>
              <Suspense fallback={null}><PWAInstallBanner /></Suspense>
            </BrowserRouter>
          </CompareProvider>
        </LanguageProvider>
      </TooltipProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
