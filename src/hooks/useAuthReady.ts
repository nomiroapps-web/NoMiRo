import { useState, useEffect } from "react";
import { supabase } from "@/lib/db";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Waits for the Supabase session to be restored from storage before
 * exposing the auth state. Prevents premature redirects to /auth on
 * page refresh.
 */
export function useAuthReady() {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 1. Restore session from storage (async but fast)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsReady(true);
    });

    // 2. Listen for future auth events (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isReady, session, user };
}
