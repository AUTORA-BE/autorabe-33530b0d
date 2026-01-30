/**
 * User profile hook
 * Fetches and manages user profile data
 * @module features/auth/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '../types/auth.types';

interface UseUserProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>) => Promise<boolean>;
}

/**
 * Hook for fetching and managing user profile
 * 
 * @param userId - User ID to fetch profile for
 * @returns Profile data and management methods
 * 
 * @example
 * ```tsx
 * const { profile, isLoading, updateProfile } = useUserProfile(user?.id);
 * ```
 */
export function useUserProfile(userId: string | undefined): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setProfile({
          id: data.id,
          userId: data.user_id,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (
    data: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: data.displayName,
          avatar_url: data.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      await fetchProfile();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  }, [userId, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}

export default useUserProfile;
