import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompareProvider } from "@/features/compare";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Eagerly loaded — critical path
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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
 * - staleTime: How long data is considered fresh (5 min)
 * - gcTime: How long unused data stays in cache (10 min)
 * - refetchOnWindowFocus: Disabled for better UX
 * - retry: Single retry on failure
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <CompareProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/car/:id" element={<CarDetail />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/sell" element={<SellCar />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/dashboard" element={<SellerDashboard />} />
                <Route path="/dashboard/stats" element={<SellerStats />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CompareProvider>
      </LanguageProvider>
    </TooltipProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);

export default App;
