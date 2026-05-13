/**
 * OAuth helper for cloud mode — wraps Supabase's native OAuth API.
 * In local mode the OIDC redirect flow in local-auth.ts handles sign-in.
 */

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
};

export const oauthHelper = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri ?? window.location.origin,
        },
      });
      if (error) return { error };
      return { data, error: null };
    },
  },
};
