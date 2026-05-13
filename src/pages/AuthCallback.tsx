/**
 * OIDC Callback Page
 * 
 * Handles the redirect from the OIDC provider after authentication.
 * Only used in local/self-hosted mode.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authLayer } from "@/lib/auth-layer";
import { isLocalMode } from "@/lib/backend-config";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      if (!isLocalMode()) {
        navigate("/parent");
        return;
      }

      try {
        const user = await authLayer.handleCallback();
        if (user) {
          navigate("/parent");
        } else {
          setError("Authentication failed. Please try again.");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed. Please try again.");
      }
    }

    processCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 text-primary underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
