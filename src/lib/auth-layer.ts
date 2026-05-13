/**
 * Unified Auth Layer
 * 
 * Routes authentication to Supabase (cloud) or OIDC/local (local mode).
 * 
 * Usage:
 *   import { authLayer } from "@/lib/auth-layer";
 *   const user = await authLayer.getUser();
 */

import { isLocalMode } from "./backend-config";
import { supabase } from "@/integrations/supabase/client";
import {
  signInWithRedirect,
  signOut as oidcSignOut,
  getUser as getOIDCUser,
  onAuthStateChange as onOIDCAuthStateChange,
  handleAuthCallback,
  initAuth,
  localSignUp,
  localSignIn,
  localSignOut,
  getLocalSession,
  type OIDCUser,
} from "./local-auth";

export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";
type AuthCallback = (event: AuthEvent, user: AppUser | null) => void;

function mapSupabaseUser(user: any): AppUser {
  return {
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name || "",
    avatar_url: user.user_metadata?.avatar_url,
  };
}

function mapOIDCUser(user: OIDCUser): AppUser {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
  };
}

export const authLayer = {
  /**
   * Sign up with email/password.
   */
  async signUp(email: string, password: string, fullName: string, redirectUrl?: string) {
    if (isLocalMode()) {
      const user = await localSignUp(email, password, fullName);
      return { data: { user: { id: user.id, email: user.email } }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl || `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { data, error };
  },

  /**
   * Sign in with email/password.
   */
  async signIn(email: string, password: string) {
    if (isLocalMode()) {
      try {
        const user = await localSignIn(email, password);
        return { data: { user: { id: user.id, email: user.email } }, error: null };
      } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  /**
   * Sign in with OIDC redirect (local mode) or OAuth (cloud mode).
   */
  async signInWithOAuth(provider: "google" | "apple") {
    if (isLocalMode()) {
      await signInWithRedirect();
      return { error: null };
    }

    // Cloud mode: use Supabase native OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  },

  /**
   * Handle OIDC callback (local mode only).
   */
  async handleCallback(): Promise<AppUser | null> {
    if (isLocalMode()) {
      const user = await handleAuthCallback();
      return user ? mapOIDCUser(user) : null;
    }
    return null;
  },

  /**
   * Get current user.
   */
  async getUser(): Promise<AppUser | null> {
    if (isLocalMode()) {
      // Try OIDC first, then local session
      const oidcUser = await getOIDCUser();
      if (oidcUser) return mapOIDCUser(oidcUser);

      const localSession = getLocalSession();
      if (localSession) return { id: localSession.id, email: localSession.email, full_name: localSession.full_name };

      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user ? mapSupabaseUser(user) : null;
  },

  /**
   * Get current session (for checking auth state).
   */
  async getSession() {
    if (isLocalMode()) {
      const user = await this.getUser();
      return { data: { session: user ? { user } : null }, error: null };
    }
    return supabase.auth.getSession();
  },

  /**
   * Sign out.
   */
  async signOut() {
    if (isLocalMode()) {
      try {
        await oidcSignOut();
      } catch {
        // OIDC might not be configured
      }
      localSignOut();
      return { error: null };
    }

    return supabase.auth.signOut();
  },

  /**
   * Listen for auth state changes.
   */
  onAuthStateChange(callback: AuthCallback): { unsubscribe: () => void } {
    if (isLocalMode()) {
      const unsub = onOIDCAuthStateChange((event, user) => {
        callback(event, user ? mapOIDCUser(user) : null);
      });
      
      // Also init on subscribe
      initAuth().then((user) => {
        if (user) callback("SIGNED_IN", mapOIDCUser(user));
      });

      return { unsubscribe: unsub };
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const mappedEvent: AuthEvent =
        event === "SIGNED_IN" ? "SIGNED_IN" :
        event === "SIGNED_OUT" ? "SIGNED_OUT" :
        "TOKEN_REFRESHED";
      callback(mappedEvent, session?.user ? mapSupabaseUser(session.user) : null);
    });

    return { unsubscribe: () => data.subscription.unsubscribe() };
  },

  /**
   * Reset password (cloud mode only).
   */
  async resetPassword(email: string, redirectUrl?: string) {
    if (isLocalMode()) {
      return { data: null, error: new Error("Password reset not available in offline mode") };
    }
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl || `${window.location.origin}/reset-password`,
    });
  },

  /**
   * Update user password.
   */
  async updatePassword(password: string) {
    if (isLocalMode()) {
      return { data: null, error: new Error("Password update not available in offline mode") };
    }
    return supabase.auth.updateUser({ password });
  },

  /**
   * Resend verification email (cloud mode only).
   */
  async resendVerification(email: string, redirectUrl?: string) {
    if (isLocalMode()) {
      return { data: null, error: new Error("Email verification not needed in offline mode") };
    }
    return supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectUrl || `${window.location.origin}/` },
    });
  },
};
