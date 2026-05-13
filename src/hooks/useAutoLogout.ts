import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 2 * 60 * 1000; // warn 2 minutes before
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

function isPWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function useAutoLogout() {
  const navigate = useNavigate();
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningShownRef = useRef(false);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/");
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningShownRef.current = false;

    warningTimerRef.current = setTimeout(() => {
      warningShownRef.current = true;
      toast({
        title: "Session expiring soon",
        description: "You'll be logged out in 2 minutes due to inactivity. Move your mouse or press a key to stay signed in.",
        variant: "destructive",
      });
    }, TIMEOUT_MS - WARNING_MS);

    logoutTimerRef.current = setTimeout(logout, TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    if (isPWA()) return;

    resetTimer();

    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [resetTimer]);
}
