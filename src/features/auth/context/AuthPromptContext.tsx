/**
 * Auth-prompt context — opens a modal when a guest tries to perform an
 * authenticated action ("positive friction"). After login, an optional
 * pending action (e.g. add favorite) is replayed.
 *
 * Usage:
 *   const { requireAuth } = useAuthPrompt();
 *   if (!requireAuth({ reason: "favorite", carId })) return;
 *   // ... do the protected action
 *
 * @module features/auth/context
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthPromptModal, type AuthPromptReason } from "../components/AuthPromptModal";

const PENDING_FAVORITE_KEY = "autora_pending_favorite_after_login";

type RequireAuthOptions = {
  /** Semantic reason — drives the modal copy. */
  reason: AuthPromptReason;
  /** Optional listing id to auto-favorite after login. Only used when reason === "favorite". */
  carId?: string;
};

type AuthPromptContextValue = {
  /** Returns true if the user is already authenticated; otherwise opens the modal and returns false. */
  requireAuth: (options: RequireAuthOptions) => boolean;
  isAuthenticated: boolean;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<AuthPromptReason>("favorite");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAuthed(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const requireAuth = useCallback(
    ({ reason: r, carId }: RequireAuthOptions) => {
      if (isAuthed) return true;
      if (r === "favorite" && carId) {
        try {
          localStorage.setItem(PENDING_FAVORITE_KEY, carId);
        } catch {
          /* storage may be unavailable */
        }
      }
      setReason(r);
      setOpen(true);
      return false;
    },
    [isAuthed],
  );

  const goToAuth = useCallback(
    (tab: "login" | "signup") => {
      const returnTo = `${location.pathname}${location.search}`;
      setOpen(false);
      navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}&tab=${tab}`);
    },
    [navigate, location],
  );

  const value = useMemo<AuthPromptContextValue>(
    () => ({ requireAuth, isAuthenticated: isAuthed }),
    [requireAuth, isAuthed],
  );

  return (
    <AuthPromptContext.Provider value={value}>
      {children}
      <AuthPromptModal
        open={open}
        onOpenChange={setOpen}
        reason={reason}
        onLogin={() => goToAuth("login")}
        onSignup={() => goToAuth("signup")}
      />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt(): AuthPromptContextValue {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) {
    // Safe fallback when provider isn't mounted (tests, isolated stories) —
    // gate everything by treating the user as guest with a no-op modal.
    return {
      requireAuth: () => false,
      isAuthenticated: false,
    };
  }
  return ctx;
}

/** Read & clear the pending favorite id (used by useFavorites after login). */
export function consumePendingFavorite(): string | null {
  try {
    const id = localStorage.getItem(PENDING_FAVORITE_KEY);
    if (id) localStorage.removeItem(PENDING_FAVORITE_KEY);
    return id;
  } catch {
    return null;
  }
}
