import { lazy, Suspense, useEffect } from "react";
import Maintenance from "@/pages/Maintenance";
import { AnimatePresence } from "framer-motion";
import { prefetchCriticalRoutes } from "@/utils/prefetchRoutes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { CompareProvider } from "@/features/compare";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthPromptProvider } from "@/features/auth";

import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAnalytics } from "@/hooks/useAnalytics";
const CompareBar = lazy(() => import("@/features/compare/components/CompareBar"));
const BottomNav = lazy(() => import("@/shared/components/BottomNav"));
const CarChatbot = lazy(() => import("@/components/CarChatbot"));
const PWAInstallBanner = lazy(() => import("@/components/PWAInstallBanner"));
const CookieBanner = lazy(() => import("@/components/CookieBanner"));
const BetaBanner = lazy(() => import("@/components/BetaBanner"));
const HelpButton = lazy(() => import("@/shared/components/HelpButton"));

// Lazy-loaded — reduces main bundle unused JS
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy-loaded pages for reduced initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const CarDetail = lazy(() => import("./pages/CarDetail"));
// Legacy /favorites routes redirect to /garage
const MyGarage = lazy(() => import("./pages/MyGarage"));
const SellCar = lazy(() => import("./pages/SellCar"));
const Messages = lazy(() => import("./pages/Messages"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Compare = lazy(() => import("./pages/Compare"));
const Recherche = lazy(() => import("./pages/Recherche"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerStats = lazy(() => import("./pages/SellerStats"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Legal = lazy(() => import("./pages/Legal"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminLayout = lazy(() => import("./features/admin/components/AdminLayout"));
const CalculateurTCO = lazy(() => import("./pages/CalculateurTCO"));
const MesAlertes = lazy(() => import("./pages/MesAlertes"));
const CreerAlerte = lazy(() => import("./pages/CreerAlerte"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Services = lazy(() => import("./pages/Services"));
const GuideLEZ = lazy(() => import("./pages/guides/GuideLEZ"));
const GuideCarPass = lazy(() => import("./pages/guides/GuideCarPass"));
const GuideAchatOccasion = lazy(() => import("./pages/guides/GuideAchatOccasion"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/blog/BlogArticle"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const CGU = lazy(() => import("./pages/CGU"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const CGV = lazy(() => import("./pages/CGV"));
const ServerError = lazy(() => import("./pages/ServerError"));
const MarquesElectriques = lazy(() => import("./pages/MarquesElectriques"));
const FiscaliteAuto2026 = lazy(() => import("./pages/FiscaliteAuto2026"));
const AutoFiscaliteit2026 = lazy(() => import("./pages/AutoFiscaliteit2026"));

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

// Purge React Query cache on logout / user switch — prevents data leakage between accounts.
import { supabase } from "@/integrations/supabase/client";
let _lastUserId: string | null | undefined = undefined;
supabase.auth.onAuthStateChange((_evt, session) => {
  const uid = session?.user?.id ?? null;
  if (_lastUserId !== undefined && _lastUserId !== uid) {
    queryClient.clear();
  }
  _lastUserId = uid;
});

/** Scroll to top on route change + trigger idle prefetching + global analytics */
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useAnalytics();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);
  return null;
}

/** All app routes, used both at root and under /:lang/* for SEO */
function AppPages() {
  return (
    <Routes>
      <Route path="/" element={<PageTransition><Index /></PageTransition>} />
      <Route path="/marques-electriques" element={<PageTransition><MarquesElectriques /></PageTransition>} />
      <Route path="/electric-brands" element={<PageTransition><MarquesElectriques /></PageTransition>} />
      <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
      {/* Vehicle detail accepts UUID or SEO slug ending with UUID */}
      <Route path="/car/:id" element={<PageTransition><CarDetail /></PageTransition>} />
      <Route path="/voiture/:id" element={<PageTransition><CarDetail /></PageTransition>} />
      <Route path="/auto/:id" element={<PageTransition><CarDetail /></PageTransition>} />
      <Route path="/favorites" element={<Navigate to="/garage" replace />} />
      <Route path="/favoris" element={<Navigate to="/garage" replace />} />
      <Route path="/favorieten" element={<Navigate to="/mijn-garage" replace />} />
      <Route path="/favoriten" element={<Navigate to="/meine-garage" replace />} />
      <Route path="/garage" element={<PageTransition><MyGarage /></PageTransition>} />
      <Route path="/mijn-garage" element={<PageTransition><MyGarage /></PageTransition>} />
      <Route path="/my-garage" element={<PageTransition><MyGarage /></PageTransition>} />
      <Route path="/meine-garage" element={<PageTransition><MyGarage /></PageTransition>} />
      <Route path="/sell" element={<PageTransition><SellCar /></PageTransition>} />
      <Route path="/vendre" element={<PageTransition><SellCar /></PageTransition>} />
      <Route path="/verkopen" element={<PageTransition><SellCar /></PageTransition>} />
      <Route path="/verkaufen" element={<PageTransition><SellCar /></PageTransition>} />
      <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
      <Route path="/about" element={<PageTransition><About /></PageTransition>} />
      <Route path="/a-propos" element={<PageTransition><About /></PageTransition>} />
      <Route path="/over-ons" element={<PageTransition><About /></PageTransition>} />
      <Route path="/ueber-uns" element={<PageTransition><About /></PageTransition>} />
      <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
      <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />
      <Route path="/recherche" element={<PageTransition><Recherche /></PageTransition>} />
      <Route path="/zoeken" element={<PageTransition><Recherche /></PageTransition>} />
      <Route path="/search" element={<PageTransition><Recherche /></PageTransition>} />
      <Route path="/suche" element={<PageTransition><Recherche /></PageTransition>} />
      <Route path="/dashboard" element={<PageTransition><SellerDashboard /></PageTransition>} />
      <Route path="/dashboard/stats" element={<PageTransition><SellerStats /></PageTransition>} />
      <Route path="/seller/:userId" element={<PageTransition><SellerProfile /></PageTransition>} />
      <Route path="/admin/*" element={<PageTransition><AdminLayout /></PageTransition>} />
      <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
      <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
      {/* Legacy routes kept for backwards-compat */}
      <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
      <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
      <Route path="/legal" element={<PageTransition><Legal /></PageTransition>} />
      <Route path="/cookies" element={<PageTransition><Cookies /></PageTransition>} />
      <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
      {/* Canonical legal pages — FR + NL */}
      <Route path="/mentions-legales" element={<PageTransition><MentionsLegales /></PageTransition>} />
      <Route path="/wettelijke-vermeldingen" element={<PageTransition><MentionsLegales /></PageTransition>} />
      <Route path="/cgu" element={<PageTransition><CGU /></PageTransition>} />
      <Route path="/voorwaarden" element={<PageTransition><CGU /></PageTransition>} />
      <Route path="/confidentialite" element={<PageTransition><Confidentialite /></PageTransition>} />
      <Route path="/privacybeleid" element={<PageTransition><Confidentialite /></PageTransition>} />
      <Route path="/cgv" element={<PageTransition><CGV /></PageTransition>} />
      <Route path="/verkoopvoorwaarden" element={<PageTransition><CGV /></PageTransition>} />
      <Route path="/500" element={<PageTransition><ServerError /></PageTransition>} />
      <Route path="/kontakt" element={<PageTransition><Contact /></PageTransition>} />
      <Route path="/calculateur-tco" element={<PageTransition><CalculateurTCO /></PageTransition>} />
      <Route path="/mes-alertes" element={<PageTransition><MesAlertes /></PageTransition>} />
      <Route path="/mes-alertes/creer" element={<PageTransition><CreerAlerte /></PageTransition>} />
      <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
      <Route path="/tarifs" element={<PageTransition><Pricing /></PageTransition>} />
      <Route path="/prijzen" element={<PageTransition><Pricing /></PageTransition>} />
      <Route path="/preise" element={<PageTransition><Pricing /></PageTransition>} />
      <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
      <Route path="/payment-canceled" element={<PageTransition><PaymentCanceled /></PageTransition>} />
      <Route path="/unsubscribe" element={<PageTransition><Unsubscribe /></PageTransition>} />
      <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
      <Route path="/diensten" element={<PageTransition><Services /></PageTransition>} />
      <Route path="/dienste" element={<PageTransition><Services /></PageTransition>} />
      <Route path="/guide/lez-belgique" element={<PageTransition><GuideLEZ /></PageTransition>} />
      <Route path="/guide/car-pass" element={<PageTransition><GuideCarPass /></PageTransition>} />
      <Route path="/guide/acheter-voiture-occasion" element={<PageTransition><GuideAchatOccasion /></PageTransition>} />
      <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
      <Route path="/blog/:slug" element={<PageTransition><BlogArticle /></PageTransition>} />
      <Route path="/fiscalite-auto-2026" element={<PageTransition><FiscaliteAuto2026 /></PageTransition>} />
      <Route path="/autofiscaliteit-2026" element={<PageTransition><AutoFiscaliteit2026 /></PageTransition>} />
      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
    </Routes>
  );
}

/** Routes wrapper — supports /:lang/* SEO prefix in parallel with legacy URLs */
function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.replace(/^\/(fr|nl|de|en)(?=\/|$)/, "")}>
        {/* Localized prefix mirrors all routes */}
        <Route path="/fr/*" element={<AppPages />} />
        <Route path="/nl/*" element={<AppPages />} />
        <Route path="/de/*" element={<AppPages />} />
        <Route path="/en/*" element={<AppPages />} />
        {/* Legacy / unprefixed routes still work */}
        <Route path="/*" element={<AppPages />} />
      </Routes>
    </AnimatePresence>
  );
}

const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const App = () => {
  if (MAINTENANCE) return <Maintenance />;
  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <LanguageProvider>
            <AuthPromptProvider>
            <CompareProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={null}><BetaBanner /></Suspense>
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
              <Suspense fallback={null}><CookieBanner /></Suspense>
              <Suspense fallback={null}><HelpButton /></Suspense>
            </CompareProvider>
            </AuthPromptProvider>
          </LanguageProvider>

        </BrowserRouter>
      </TooltipProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
