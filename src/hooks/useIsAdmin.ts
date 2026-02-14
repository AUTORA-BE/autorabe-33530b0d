/**
 * Hook to check if the current user has admin role
 * @module hooks
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether the current authenticated user has the admin role
 */
export const useIsAdmin = (userId: string | undefined): boolean => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!error && data) setIsAdmin(true);
      else setIsAdmin(false);
    };

    check();
  }, [userId]);

  return isAdmin;
};
