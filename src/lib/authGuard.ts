/**
 * Global auth session guard.
 * Listens to Supabase auth events; on session expiry or forced sign-out
 * after a previously-authenticated session, redirects to /auth?reason=expired
 * and surfaces a toast. Mounted once in App.tsx.
 */
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PUBLIC_PREFIXES = ["/auth", "/reset-password", "/", "/recherche", "/garage", "/seller", "/lez-belgique", "/calculateur-tco", "/blog", "/faq", "/mentions-legales", "/confidentialite", "/cgu", "/rgpd"];

const isProtectedRoute = (path: string): boolean => {
  // Treat anything under /dashboard, /admin, /messages, /favorites, /sell as protected
  return /^\/(dashboard|admin|messages|favorites|sell|profile|mon-garage)(\/|$)/.test(path);
};

export const useAuthSessionGuard = (): void => {
  const navigate = useNavigate();
  const location = useLocation();
  const wasAuthed = useRef(false);

  useEffect(() => {
    // Seed initial state
    supabase.auth.getSession().then(({ data }) => {
      wasAuthed.current = !!data.session;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nowAuthed = !!session;

      // Detect expiry: was authed, now isn't, and not a deliberate user sign-out from /auth page
      if (event === "SIGNED_OUT" && wasAuthed.current) {
        const path = window.location.pathname;
        if (isProtectedRoute(path)) {
          toast.error("Session expirée", {
            description: "Veuillez vous reconnecter pour continuer.",
          });
          navigate(`/auth?reason=expired&next=${encodeURIComponent(path + window.location.search)}`, { replace: true });
        }
      }

      wasAuthed.current = nowAuthed;
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);
};
