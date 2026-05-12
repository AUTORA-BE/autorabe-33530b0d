/**
 * Seller Dashboard page — wraps the feature component with layout
 * @module pages
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Header, Footer, BackButton } from "@/shared/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import SellerDashboardComponent from "@/features/listings/components/SellerDashboard";

const SellerDashboardPage = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

  return (
    <div className="page-gradient">
      <SEOHead noIndex />
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <BackButton to="/" className="mb-4" />
          <div className="max-w-6xl mx-auto">
            <SellerDashboardComponent />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboardPage;
