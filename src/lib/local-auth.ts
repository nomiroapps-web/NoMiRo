/**
 * Generic OIDC Authentication Layer
 * 
 * Replaces Supabase Auth for self-hosted deployments.
 * Compatible with Keycloak, Auth0, Authentik, or any OIDC provider.
 * 
 * Environment variables:
 *   VITE_OIDC_AUTHORITY     - Issuer URL (e.g. https://auth.nomiro.app/realms/nomiro)
 *   VITE_OIDC_CLIENT_ID     - Client ID
 *   VITE_OIDC_REDIRECT_URI  - Callback URL
 *   VITE_OIDC_SCOPE         - Scopes (default: "openid profile email")
 */

// oidc-client-ts is dynamically imported to avoid build errors when not installed
import { backendConfig } from "./backend-config";

let userManager: any = null;

// Auth state listeners
type AuthListener = (event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED", user: OIDCUser | null) => void;
const listeners: Set<AuthListener> = new Set();

export interface OIDCUser {
  id: string;         // sub claim
  email: string;
  full_name: string;
  avatar_url?: string;
  access_token: string;
  id_token?: string;
  expires_at?: number;
  raw: any;
}

async function getUserManager(): Promise<any> {
  if (userManager) return userManager;

  const { UserManager: UM, WebStorageStateStore } = await import("oidc-client-ts");
  const cfg = backendConfig.oidc;
  userManager = new UM({
    authority: cfg.authority,
    client_id: cfg.client_id,
    redirect_uri: cfg.redirect_uri,
    post_logout_redirect_uri: cfg.post_logout_redirect_uri,
    scope: cfg.scope,
    response_type: cfg.response_type,
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: localStorage }),
  });

  // Listen for token refresh
  userManager.events.addUserLoaded((user: any) => {
    const oidcUser = mapUser(user);
    notifyListeners("TOKEN_REFRESHED", oidcUser);
  });

  userManager.events.addUserUnloaded(() => {
    notifyListeners("SIGNED_OUT", null);
  });

  return userManager;
}

function mapUser(user: any): OIDCUser {
  const profile = user.profile;
  return {
    id: profile.sub,
    email: (profile.email as string) || "",
    full_name: (profile.name as string) || (profile.preferred_username as string) || "",
    avatar_url: profile.picture as string | undefined,
    access_token: user.access_token,
    id_token: user.id_token,
    expires_at: user.expires_at,
    raw: user,
  };
}

function notifyListeners(event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED", user: OIDCUser | null) {
  listeners.forEach((fn) => fn(event, user));
}

// ── Public API ──

export async function signInWithRedirect(): Promise<void> {
  const mgr = await getUserManager();
  await mgr.signinRedirect();
}

export async function signInWithPopup(): Promise<OIDCUser | null> {
  const mgr = await getUserManager();
  const user = await mgr.signinPopup();
  if (user) {
    const oidcUser = mapUser(user);
    notifyListeners("SIGNED_IN", oidcUser);
    return oidcUser;
  }
  return null;
}

/**
 * Call this on the /auth/callback page to complete the OIDC flow.
 */
export async function handleAuthCallback(): Promise<OIDCUser | null> {
  const mgr = await getUserManager();
  const user = await mgr.signinRedirectCallback();
  if (user) {
    const oidcUser = mapUser(user);
    notifyListeners("SIGNED_IN", oidcUser);
    return oidcUser;
  }
  return null;
}

export async function signOut(): Promise<void> {
  const mgr = await getUserManager();
  await mgr.signoutRedirect();
}

export async function getUser(): Promise<OIDCUser | null> {
  const mgr = await getUserManager();
  const user = await mgr.getUser();
  if (user && !user.expired) {
    return mapUser(user);
  }
  return null;
}

export async function getAccessToken(): Promise<string | null> {
  const user = await getUser();
  return user?.access_token || null;
}

export function onAuthStateChange(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Check if user session is valid on app startup.
 */
export async function initAuth(): Promise<OIDCUser | null> {
  const user = await getUser();
  if (user) {
    notifyListeners("SIGNED_IN", user);
  }
  return user;
}

// ── Local password auth helpers ────────────────────────────────────────────
// NOTE: This local mode is for offline/demo use only.
// For production deployments, use the OIDC flow (VITE_BACKEND_MODE=local + OIDC provider).

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8-hour session expiry

/** Derive a PBKDF2 key from a password + salt (100k iterations, SHA-256). */
async function deriveKey(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function localSignUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ id: string; email: string; full_name: string }> {
  const users = JSON.parse(localStorage.getItem("nomiro_local_users") || "[]");

  if (users.find((u: any) => u.email === email)) {
    throw new Error("This email is already registered.");
  }

  const salt = randomHex(16); // 128-bit random salt
  const passwordHash = await deriveKey(password, salt);
  const userId = crypto.randomUUID();

  users.push({ id: userId, email, full_name: fullName, password_hash: passwordHash, salt });
  localStorage.setItem("nomiro_local_users", JSON.stringify(users));

  const session = { id: userId, email, full_name: fullName, expires_at: Date.now() + SESSION_TTL_MS };
  localStorage.setItem("nomiro_local_session", JSON.stringify(session));
  return { id: userId, email, full_name: fullName };
}

export async function localSignIn(
  email: string,
  password: string
): Promise<{ id: string; email: string; full_name: string }> {
  const users = JSON.parse(localStorage.getItem("nomiro_local_users") || "[]");
  const user = users.find((u: any) => u.email === email);

  if (!user) throw new Error("Invalid email or password.");

  const hash = await deriveKey(password, user.salt || "");
  if (hash !== user.password_hash) throw new Error("Invalid email or password.");

  const session = { id: user.id, email: user.email, full_name: user.full_name, expires_at: Date.now() + SESSION_TTL_MS };
  localStorage.setItem("nomiro_local_session", JSON.stringify(session));
  return { id: user.id, email: user.email, full_name: user.full_name };
}

export function getLocalSession(): { id: string; email: string; full_name: string } | null {
  const raw = localStorage.getItem("nomiro_local_session");
  if (!raw) return null;
  const session = JSON.parse(raw);
  if (session.expires_at && Date.now() > session.expires_at) {
    localStorage.removeItem("nomiro_local_session");
    return null;
  }
  return session;
}

export function localSignOut(): void {
  localStorage.removeItem("nomiro_local_session");
}
