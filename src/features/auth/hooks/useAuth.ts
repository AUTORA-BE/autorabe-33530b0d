/**
 * Main authentication hook
 * Provides auth state and actions
 * @module features/auth/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AuthState, LoginCredentials, SignupCredentials, AuthResult } from '../types/auth.types';

/**
 * Hook for managing authentication state and actions
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, signIn, signOut } = useAuth();
 * ```
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: { type: 'invalid_credentials', message: error.message }
          };
        }
        return {
          success: false,
          error: { type: 'unknown', message: error.message }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { type: 'network_error', message: 'Network error occurred' }
      };
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (credentials: SignupCredentials): Promise<AuthResult> => {
    try {
      const isPro = credentials.userType === 'professionnel';
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: credentials.fullName,
            user_type: isPro ? 'professionnel' : 'particulier',
            phone: credentials.phone ?? null,
            postal_code: credentials.postalCode ?? null,
            garage_name: isPro ? (credentials.garageName ?? null) : null,
            bce_number: isPro ? (credentials.bceNumber ?? null) : null,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return {
            success: false,
            error: { type: 'user_exists', message: error.message }
          };
        }
        return {
          success: false,
          error: { type: 'unknown', message: error.message }
        };
      }

      // Profile + dealer queue are created by the handle_new_user_profile trigger
      // (SECURITY DEFINER) using raw_user_meta_data, since the session isn't
      // available immediately after signup when email confirmation is required.
      if (signUpData.user) {
        if (isPro) {
          // Notify admin (fire-and-forget)
          supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'new-dealer-signup',
              recipientEmail: 'autoracontact@gmail.com',
              idempotencyKey: `dealer-signup-${signUpData.user.id}`,
              templateData: {
                fullName: credentials.fullName,
                email: credentials.email,
                phone: credentials.phone,
                garageName: credentials.garageName,
                bceNumber: credentials.bceNumber,
                postalCode: credentials.postalCode,
              },
            },
          }).catch(() => {});
        }

        // Welcome email for every new user (fire-and-forget)
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'welcome',
            recipientEmail: credentials.email,
            idempotencyKey: `welcome-${signUpData.user.id}`,
            templateData: { name: credentials.fullName },
          },
        }).catch(() => {});
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { type: 'network_error', message: 'Network error occurred' }
      };
    }
  }, []);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return {
          success: false,
          error: { type: 'unknown', message: error.message }
        };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { type: 'network_error', message: 'Network error occurred' }
      };
    }
  }, []);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      // Rate limit côté client (3/h/email) — UX, évite double-clic & spam involontaire
      const normalizedEmail = email.trim().toLowerCase();
      const { checkServerRateLimit } = await import('@/lib/security');
      const { allowed } = await checkServerRateLimit('password_reset', normalizedEmail);
      if (!allowed) {
        return {
          success: false,
          error: {
            type: 'unknown',
            message: 'Trop de demandes. Réessayez dans 1 heure.',
          },
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: { type: 'unknown', message: error.message }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { type: 'network_error', message: 'Network error occurred' }
      };
    }
  }, []);

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = useCallback(async (returnTo?: string): Promise<AuthResult> => {
    try {
      // Preserve the intended destination (e.g. the OAuth consent screen) so the
      // provider round-trip does not drop the user on the homepage.
      const safeReturnTo = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: safeReturnTo
            ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(safeReturnTo)}`
            : window.location.origin,
        },
      });

      if (error) {
        return {
          success: false,
          error: { type: 'unknown', message: error.message }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { type: 'network_error', message: 'Network error occurred' }
      };
    }
  }, []);

  /**
   * Sign in with Apple OAuth
   */
  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: window.location.origin },
      });

      if (error) {
        return {
          success: false,
          error: { type: 'unknown', message: error.message }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { type: 'network_error', message: 'Network error occurred' }
      };
    }
  }, []);

  /**
   * Resend verification email
   */
  const resendVerificationEmail = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return {
          success: false,
          error: { type: 'unknown', message: error.message }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { type: 'network_error', message: 'Network error occurred' }
      };
    }
  }, []);

  const state: AuthState = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    resendVerificationEmail,
  };
}

export default useAuth;
