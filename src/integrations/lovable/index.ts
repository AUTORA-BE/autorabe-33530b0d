// OAuth wrapper around the native Supabase client.
// Previously delegated to @lovable.dev/cloud-auth-js; now talks to Supabase
// directly. The public shape (`lovable.auth.signInWithOAuth`) is kept stable
// so existing call sites in useAuth.ts do not need to change.

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple",
      opts?: SignInOptions
    ) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error };
      }

      // Supabase triggers the browser redirect itself; surface a success marker
      // so existing callers that check `result.error` keep working.
      return { redirected: true, data };
    },
  },
};
