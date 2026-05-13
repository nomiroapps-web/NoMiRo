/**
 * Backend Client - Drop-in replacement for supabase client.
 * 
 * In cloud mode: proxies to the real Supabase client.
 * In local mode: routes to IndexedDB via the data layer.
 * 
 * Usage (replace existing imports):
 *   import { db, auth } from "@/lib/backend-client";
 *   
 * The `db` object has the same `.from().select().eq()` API as Supabase.
 * The `auth` object wraps authLayer for the same interface.
 */

import { isLocalMode } from "./backend-config";
import { supabase } from "@/integrations/supabase/client";
import { dataLayer } from "./data-layer";
import { authLayer } from "./auth-layer";
import {
  localInsert,
  localUpdate,
  localDelete,
  localQuery,
  localGetByIndex,
  localGetById,
} from "./local-db";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a Supabase-compatible query builder for local mode.
 */
function createLocalQueryBuilder(table: string) {
  type Filter = { col: string; op: string; val: any };
  let filters: Filter[] = [];
  let orders: { col: string; asc: boolean }[] = [];
  let limitN: number | null = null;
  let selectCols = "*";
  let mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  let payload: any = null;
  let isSingle = false;
  let isMaybeSingle = false;

  const applyFilters = (records: any[]) => {
    return records.filter((r) =>
      filters.every((f) => {
        const v = r[f.col];
        switch (f.op) {
          case "eq": return v === f.val;
          case "neq": return v !== f.val;
          case "gt": return v > f.val;
          case "gte": return v >= f.val;
          case "lt": return v < f.val;
          case "lte": return v <= f.val;
          case "in": return Array.isArray(f.val) && f.val.includes(v);
          case "is": return f.val === null ? v === null : v === f.val;
          default: return true;
        }
      })
    );
  };

  const applyOrders = (records: any[]) => {
    for (const o of [...orders].reverse()) {
      records.sort((a, b) => {
        if (a[o.col] < b[o.col]) return o.asc ? -1 : 1;
        if (a[o.col] > b[o.col]) return o.asc ? 1 : -1;
        return 0;
      });
    }
    return records;
  };

  const execute = async () => {
    try {
      switch (mode) {
        case "select": {
          let all = await localQuery<any>(table);
          all = applyFilters(all);
          all = applyOrders(all);
          if (limitN) all = all.slice(0, limitN);
          if (isSingle) {
            return { data: all[0] || null, error: all.length === 0 ? { message: "No rows found", code: "PGRST116" } : null };
          }
          if (isMaybeSingle) {
            return { data: all[0] || null, error: null };
          }
          return { data: all, error: null };
        }
        case "insert": {
          const records = Array.isArray(payload) ? payload : [payload];
          const now = new Date().toISOString();
          const inserted = [];
          for (const rec of records) {
            const row = { id: uuidv4(), created_at: now, updated_at: now, ...rec };
            await localInsert(table, row);
            inserted.push(row);
          }
          if (isSingle) return { data: inserted[0] || null, error: null };
          return { data: inserted, error: null };
        }
        case "update": {
          let all = await localQuery<any>(table);
          all = applyFilters(all);
          for (const rec of all) {
            await localUpdate(table, rec.id, payload);
          }
          if (isSingle) {
            const updated = all.length > 0 ? { ...all[0], ...payload } : null;
            return { data: updated, error: null };
          }
          return { data: all.map((r: any) => ({ ...r, ...payload })), error: null };
        }
        case "delete": {
          let all = await localQuery<any>(table);
          all = applyFilters(all);
          for (const rec of all) {
            await localDelete(table, rec.id);
          }
          return { data: all, error: null };
        }
        case "upsert": {
          const records = Array.isArray(payload) ? payload : [payload];
          const now = new Date().toISOString();
          const upserted = [];
          for (const rec of records) {
            const existing = rec.id ? await localGetById<Record<string, unknown>>(table, rec.id) : null;
            if (existing) {
              await localUpdate(table, rec.id, { ...rec, updated_at: now });
              upserted.push({ ...existing, ...rec, updated_at: now });
            } else {
              const row = { id: uuidv4(), created_at: now, updated_at: now, ...rec };
              await localInsert(table, row);
              upserted.push(row);
            }
          }
          if (isSingle) return { data: upserted[0] || null, error: null };
          return { data: upserted, error: null };
        }
        default:
          return { data: null, error: { message: "Unknown operation" } };
      }
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  };

  const builder: any = {
    select(cols?: string) { mode = "select"; if (cols) selectCols = cols; return builder; },
    insert(data: any) { mode = "insert"; payload = data; return builder; },
    update(data: any) { mode = "update"; payload = data; return builder; },
    delete() { mode = "delete"; return builder; },
    upsert(data: any) { mode = "upsert"; payload = data; return builder; },
    eq(col: string, val: any) { filters.push({ col, op: "eq", val }); return builder; },
    neq(col: string, val: any) { filters.push({ col, op: "neq", val }); return builder; },
    gt(col: string, val: any) { filters.push({ col, op: "gt", val }); return builder; },
    gte(col: string, val: any) { filters.push({ col, op: "gte", val }); return builder; },
    lt(col: string, val: any) { filters.push({ col, op: "lt", val }); return builder; },
    lte(col: string, val: any) { filters.push({ col, op: "lte", val }); return builder; },
    in(col: string, val: any[]) { filters.push({ col, op: "in", val }); return builder; },
    is(col: string, val: any) { filters.push({ col, op: "is", val }); return builder; },
    order(col: string, opts?: { ascending?: boolean }) { orders.push({ col, asc: opts?.ascending !== false }); return builder; },
    limit(n: number) { limitN = n; return builder; },
    single() { isSingle = true; return execute(); },
    maybeSingle() { isMaybeSingle = true; return execute(); },
    then(resolve: any, reject?: any) { return execute().then(resolve, reject); },
  };

  return builder;
}

/**
 * Local storage adapter (simplified, stores as base64 in IndexedDB).
 */
function createLocalStorage() {
  return {
    from(bucket: string) {
      return {
        async upload(path: string, file: File, opts?: any) {
          // Convert to base64 and store in localStorage
          return new Promise<{ data: any; error: any }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const key = `storage:${bucket}:${path}`;
              try {
                localStorage.setItem(key, reader.result as string);
                resolve({ data: { path }, error: null });
              } catch (err: any) {
                resolve({ data: null, error: { message: err.message } });
              }
            };
            reader.onerror = () => resolve({ data: null, error: { message: "Failed to read file" } });
            reader.readAsDataURL(file);
          });
        },
        async download(path: string) {
          const key = `storage:${bucket}:${path}`;
          const data = localStorage.getItem(key);
          if (data) {
            const blob = await fetch(data).then((r) => r.blob());
            return { data: blob, error: null };
          }
          return { data: null, error: { message: "File not found" } };
        },
        getPublicUrl(path: string) {
          const key = `storage:${bucket}:${path}`;
          const data = localStorage.getItem(key);
          return { data: { publicUrl: data || "" } };
        },
        async createSignedUrl(path: string, expiresIn: number) {
          const key = `storage:${bucket}:${path}`;
          const data = localStorage.getItem(key);
          return { data: data ? { signedUrl: data } : null, error: data ? null : { message: "Not found" } };
        },
        async remove(paths: string[]) {
          for (const path of paths) {
            localStorage.removeItem(`storage:${bucket}:${path}`);
          }
          return { data: paths, error: null };
        },
      };
    },
  };
}

/**
 * Local auth adapter matching Supabase auth API.
 */
function createLocalAuth() {
  const listeners: Set<(event: string, session: any) => void> = new Set();

  const getSessionFromLocal = (): any => {
    const raw = localStorage.getItem("nomiro_local_session");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return { user, access_token: "local-token", refresh_token: "local-refresh", expires_in: 3600, token_type: "bearer" };
  };

  const notify = (event: string) => {
    const session = getSessionFromLocal();
    listeners.forEach((fn) => fn(event, session));
  };

  return {
    async getSession() {
      const session = getSessionFromLocal();
      return { data: { session }, error: null };
    },
    async getUser() {
      const session = getSessionFromLocal();
      return { data: { user: session?.user || null }, error: null };
    },
    async signUp(opts: { email: string; password: string; options?: any }) {
      try {
        const user = await authLayer.signUp(opts.email, opts.password, opts.options?.data?.full_name || "");
        notify("SIGNED_IN");
        return user;
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    async signInWithPassword(opts: { email: string; password: string }) {
      const result = await authLayer.signIn(opts.email, opts.password);
      if (!result.error) notify("SIGNED_IN");
      return result;
    },
    async signOut() {
      await authLayer.signOut();
      notify("SIGNED_OUT");
      return { error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      listeners.add(callback);
      // Immediately fire with current state
      const session = getSessionFromLocal();
      if (session) {
        setTimeout(() => callback("INITIAL_SESSION", session), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => { listeners.delete(callback); },
          },
        },
      };
    },
    async resetPasswordForEmail(email: string, opts?: any) {
      return authLayer.resetPassword(email, opts?.redirectTo);
    },
    async updateUser(updates: { password?: string }) {
      if (updates.password) return authLayer.updatePassword(updates.password);
      return { data: null, error: null };
    },
    async resend(opts: { type: string; email: string; options?: any }) {
      return authLayer.resendVerification(opts.email, opts.options?.emailRedirectTo);
    },
  };
}

/**
 * Local functions adapter (no-op or simplified for local mode).
 */
function createLocalFunctions() {
  return {
    async invoke(name: string, opts?: { body?: any }) {
      console.warn(`[Local Mode] Edge function "${name}" called but not available offline. Body:`, opts?.body);
      // Return a generic success for non-critical functions
      switch (name) {
        case "send-2fa-code":
          return { data: { success: true, message: "2FA not available in offline mode" }, error: null };
        case "verify-2fa":
          return { data: { success: true }, error: null };
        case "send-parent-invite":
          return { data: { success: true, message: "Invites not available offline" }, error: null };
        case "send-push-notification":
          return { data: { success: true }, error: null };
        default:
          return { data: null, error: { message: `Function "${name}" not available in offline mode` } };
      }
    },
  };
}

// ── Exports ──

/**
 * Drop-in replacement for `supabase` client.
 * In cloud mode, returns the real Supabase client.
 * In local mode, returns a compatible IndexedDB-backed client.
 */
export function getBackendClient() {
  if (isLocalMode()) {
    return {
      from: (table: string) => createLocalQueryBuilder(table),
      auth: createLocalAuth(),
      storage: createLocalStorage(),
      functions: createLocalFunctions(),
      channel: (name: string) => ({
        on: (...args: any[]) => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      removeChannel: (_channel: any) => {},
    };
  }
  return supabase as any;
}

/**
 * Singleton backend client.
 * Import this instead of `supabase` from integrations.
 */
export const backend = getBackendClient();
