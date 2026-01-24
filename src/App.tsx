import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompareProvider } from "@/contexts/CompareContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Analytics from "./components/Analytics";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ScrollProgressBar from "./components/ScrollProgressBar";
import { FaviconBadge } from "./components/FaviconBadge";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CarDetail from "./pages/CarDetail";
import Favorites from "./pages/Favorites";
import SellCar from "./pages/SellCar";
import Messages from "./pages/Messages";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Compare from "./pages/Compare";
import SellerDashboard from "./pages/SellerDashboard";
import SellerStats from "./pages/SellerStats";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Legal from "./pages/Legal";
import Contact from "./pages/Contact";
import AdminReports from "./pages/AdminReports";
import CookieConsent from "./components/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <CompareProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollProgressBar />
            <ScrollToTop />
            <Analytics />
            <FaviconBadge />
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
            <CookieConsent />
            <ScrollToTopButton />
          </BrowserRouter>
        </CompareProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
