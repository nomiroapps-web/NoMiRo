/**
 * Backend Configuration
 * 
 * Switch between "cloud" (Supabase) and "local" (IndexedDB + OIDC) modes.
 * 
 * For self-hosting on nomiro.app:
 *   1. Set VITE_BACKEND_MODE=local in your .env
 *   2. Configure OIDC settings below
 *   3. Build and deploy: npm run build
 */

export type BackendMode = "cloud" | "local";

export interface OIDCConfig {
  authority: string;       // e.g. https://auth.nomiro.app/realms/nomiro
  client_id: string;       // e.g. nomiro-web
  redirect_uri: string;    // e.g. https://nomiro.app/auth/callback
  post_logout_redirect_uri: string;
  scope: string;           // e.g. "openid profile email"
  response_type: string;   // typically "code"
}

export interface BackendConfig {
  mode: BackendMode;
  oidc: OIDCConfig;
}

const defaultOIDCConfig: OIDCConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || "https://auth.example.com/realms/nomiro",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "nomiro-web",
  redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: import.meta.env.VITE_OIDC_POST_LOGOUT_URI || window.location.origin,
  scope: import.meta.env.VITE_OIDC_SCOPE || "openid profile email",
  response_type: "code",
};

export const backendConfig: BackendConfig = {
  mode: (import.meta.env.VITE_BACKEND_MODE as BackendMode) || "cloud",
  oidc: defaultOIDCConfig,
};

export function isLocalMode(): boolean {
  return backendConfig.mode === "local";
}

export function isCloudMode(): boolean {
  return backendConfig.mode === "cloud";
}
