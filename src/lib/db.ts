/**
 * Compatibility re-export.
 * 
 * This module exports the backend client as `supabase` for backward compatibility
 * with all existing code. In cloud mode it's the real Supabase client; in local
 * mode it's the IndexedDB-backed drop-in replacement.
 * 
 * Existing code can continue to use:
 *   import { supabase } from "@/lib/db";
 * 
 * Or migrate gradually to:
 *   import { backend } from "@/lib/backend-client";
 */

export { backend as supabase } from "./backend-client";
export { backend } from "./backend-client";
