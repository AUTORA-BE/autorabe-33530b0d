/**
 * Admin authentication hook with role verification
 * @module features/admin/hooks
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdminAuth(): AdminAuthState {
  const navigate = useNavigate();
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: hasAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (!hasAdmin) {
        navigate('/');
        return;
      }

      setState({ user, isAdmin: true, isLoading: false });
    };

    check();
  }, [navigate]);

  return state;
}
