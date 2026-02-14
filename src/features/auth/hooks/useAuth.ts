/**
 * Main authentication hook
 * Provides auth state and actions
 * @module features/auth/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
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
      (event, session) => {
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
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: credentials.fullName,
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        return {
          success: false,
          error: { type: 'unknown', message: result.error.message }
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
      const result = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        return {
          success: false,
          error: { type: 'unknown', message: result.error.message }
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
