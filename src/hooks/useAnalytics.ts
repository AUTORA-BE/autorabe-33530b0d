/**
 * Global analytics hook — mounted once at App root.
 * - Tracks SPA pageviews on route change
 * - Identifies user (id + role + email) on auth, resets on logout
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { identifyUser, resetUser, trackPageview } from "@/lib/analytics";
import { fetchUserRole, userRoleQueryKey } from "@/hooks/useUserRole";

export function useAnalytics(): void {
  const { pathname, search } = useLocation();
  const lastPath = useRef<string>("");
  const queryClient = useQueryClient();

  // SPA pageview
  useEffect(() => {
    const url = pathname + search;
    if (url === lastPath.current) return;
    lastPath.current = url;
    trackPageview();
  }, [pathname, search]);

  // Identify on auth state change
  useEffect(() => {
    let cancelled = false;

    const loadRoleAndIdentify = async (userId: string, email?: string | null) => {
      try {
        // Shared cache key: getSession() + onAuthStateChange(INITIAL_SESSION)
        // no longer produce two identical user_roles requests.
        const role = await queryClient.fetchQuery({
          queryKey: userRoleQueryKey(userId),
          queryFn: () => fetchUserRole(userId),
          staleTime: 5 * 60 * 1000,
        });
        if (cancelled) return;
        identifyUser({ user_id: userId, email: email ?? undefined, role });
      } catch {
        identifyUser({ user_id: userId, email: email ?? undefined, role: "private" });
      }
    };


    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadRoleAndIdentify(session.user.id, session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        resetUser();
      } else {
        loadRoleAndIdentify(session.user.id, session.user.email);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
}
