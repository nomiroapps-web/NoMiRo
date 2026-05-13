/**
 * IndexedDB Data Layer
 * 
 * Mirrors the Supabase schema for fully offline operation.
 * Uses the `idb` library for a promise-based IndexedDB API.
 */

import { openDB, type IDBPDatabase } from "idb";
import { v4 as uuidv4 } from "uuid";

const DB_NAME = "nomiro-local";
const DB_VERSION = 1;

export interface LocalDBSchema {
  profiles: {
    key: string;
    value: {
      id: string;
      user_id: string;
      full_name: string;
      role: "parent" | "child";
      avatar_url: string | null;
      phone_number: string | null;
      two_factor_enabled: boolean;
      two_factor_code: string | null;
      two_factor_code_expires_at: string | null;
      created_at: string;
      updated_at: string;
    };
    indexes: { "by-user": string };
  };
  families: {
    key: string;
    value: {
      id: string;
      name: string;
      owner_id: string;
      currency_code: string;
      currency_symbol: string;
      locale: string;
      point_to_currency_rate: number;
      created_at: string;
      updated_at: string;
    };
    indexes: { "by-owner": string };
  };
  family_members: {
    key: string;
    value: {
      id: string;
      family_id: string;
      user_id: string;
      role: "parent" | "child";
      created_at: string;
    };
    indexes: { "by-family": string; "by-user": string };
  };
  children: {
    key: string;
    value: {
      id: string;
      family_id: string;
      user_id: string | null;
      name: string;
      age: number | null;
      birthdate: string | null;
      avatar_index: number;
      points_balance: number;
      level: number;
      pin_code: string | null;
      email: string | null;
      created_at: string;
      updated_at: string;
    };
    indexes: { "by-family": string; "by-user": string };
  };
  tasks: {
    key: string;
    value: {
      id: string;
      family_id: string;
      name: string;
      description: string | null;
      icon: string;
      category: string;
      difficulty: string;
      points: number;
      status: string;
      assigned_to: string;
      assigned_by: string | null;
      template_id: string | null;
      requires_photo: boolean;
      photo_url: string | null;
      due_date: string | null;
      completed_at: string | null;
      verified_at: string | null;
      rejection_reason: string | null;
      recurrence_type: string | null;
      recurrence_days: number[] | null;
      created_at: string;
      updated_at: string;
    };
    indexes: { "by-family": string; "by-assigned": string; "by-status": string };
  };
  rewards: {
    key: string;
    value: {
      id: string;
      family_id: string;
      name: string;
      description: string | null;
      icon: string;
      category: string;
      points_cost: number;
      quantity_limit: number | null;
      is_active: boolean;
      image_url: string | null;
      created_at: string;
      updated_at: string;
    };
    indexes: { "by-family": string };
  };
  redemptions: {
    key: string;
    value: {
      id: string;
      reward_id: string;
      child_id: string;
      points_spent: number;
      status: string;
      approved_by: string | null;
      approved_at: string | null;
      created_at: string;
    };
    indexes: { "by-child": string; "by-reward": string };
  };
  notifications: {
    key: string;
    value: {
      id: string;
      user_id: string;
      title: string;
      message: string | null;
      type: string;
      icon: string;
      is_read: boolean;
      action_url: string | null;
      related_task_id: string | null;
      related_reward_id: string | null;
      related_child_id: string | null;
      created_at: string;
    };
    indexes: { "by-user": string };
  };
  point_transactions: {
    key: string;
    value: {
      id: string;
      child_id: string;
      amount: number;
      transaction_type: string;
      description: string | null;
      task_id: string | null;
      redemption_id: string | null;
      created_at: string;
    };
    indexes: { "by-child": string };
  };
  achievements: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string | null;
      icon: string;
      category: string | null;
      points_required: number | null;
      tasks_required: number | null;
      created_at: string;
    };
  };
  child_achievements: {
    key: string;
    value: {
      id: string;
      child_id: string;
      achievement_id: string;
      earned_at: string;
    };
    indexes: { "by-child": string };
  };
  task_templates: {
    key: string;
    value: {
      id: string;
      family_id: string;
      name: string;
      description: string | null;
      icon: string;
      category: string;
      difficulty: string;
      default_points: number;
      requires_photo: boolean;
      created_at: string;
      updated_at: string;
    };
    indexes: { "by-family": string };
  };
  family_invitations: {
    key: string;
    value: {
      id: string;
      family_id: string;
      email: string;
      invited_by: string;
      token: string;
      status: string;
      expires_at: string;
      accepted_at: string | null;
      created_at: string;
    };
    indexes: { "by-family": string; "by-email": string; "by-token": string };
  };
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Profiles
      const profiles = db.createObjectStore("profiles", { keyPath: "id" });
      profiles.createIndex("by-user", "user_id", { unique: true });

      // Families
      const families = db.createObjectStore("families", { keyPath: "id" });
      families.createIndex("by-owner", "owner_id");

      // Family members
      const fm = db.createObjectStore("family_members", { keyPath: "id" });
      fm.createIndex("by-family", "family_id");
      fm.createIndex("by-user", "user_id");

      // Children
      const children = db.createObjectStore("children", { keyPath: "id" });
      children.createIndex("by-family", "family_id");
      children.createIndex("by-user", "user_id");

      // Tasks
      const tasks = db.createObjectStore("tasks", { keyPath: "id" });
      tasks.createIndex("by-family", "family_id");
      tasks.createIndex("by-assigned", "assigned_to");
      tasks.createIndex("by-status", "status");

      // Rewards
      const rewards = db.createObjectStore("rewards", { keyPath: "id" });
      rewards.createIndex("by-family", "family_id");

      // Redemptions
      const redemptions = db.createObjectStore("redemptions", { keyPath: "id" });
      redemptions.createIndex("by-child", "child_id");
      redemptions.createIndex("by-reward", "reward_id");

      // Notifications
      const notifications = db.createObjectStore("notifications", { keyPath: "id" });
      notifications.createIndex("by-user", "user_id");

      // Point transactions
      const pt = db.createObjectStore("point_transactions", { keyPath: "id" });
      pt.createIndex("by-child", "child_id");

      // Achievements
      db.createObjectStore("achievements", { keyPath: "id" });

      // Child achievements
      const ca = db.createObjectStore("child_achievements", { keyPath: "id" });
      ca.createIndex("by-child", "child_id");

      // Task templates
      const tt = db.createObjectStore("task_templates", { keyPath: "id" });
      tt.createIndex("by-family", "family_id");

      // Family invitations
      const fi = db.createObjectStore("family_invitations", { keyPath: "id" });
      fi.createIndex("by-family", "family_id");
      fi.createIndex("by-email", "email");
      fi.createIndex("by-token", "token");
    },
  });

  return dbInstance;
}

// ── Generic CRUD helpers ──

export async function localInsert<T extends { id?: string }>(
  storeName: string,
  record: T
): Promise<T & { id: string }> {
  const db = await getDB();
  const now = new Date().toISOString();
  const row = {
    ...record,
    id: record.id || uuidv4(),
    created_at: now,
    updated_at: now,
  } as T & { id: string };
  await db.put(storeName, row);
  return row;
}

export async function localUpdate(
  storeName: string,
  id: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get(storeName, id);
  if (!existing) throw new Error(`Record not found in ${storeName}: ${id}`);
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await db.put(storeName, updated);
}

export async function localDelete(storeName: string, id: string): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, id);
}

export async function localGetById<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(storeName, id);
}

export async function localGetAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(storeName);
}

export async function localGetByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await getDB();
  return db.getAllFromIndex(storeName, indexName, value);
}

/**
 * Simple query helper with client-side filtering.
 * For more complex queries, retrieve by index then filter.
 */
export async function localQuery<T>(
  storeName: string,
  filter?: (record: T) => boolean,
  options?: { orderBy?: keyof T; ascending?: boolean; limit?: number }
): Promise<T[]> {
  const db = await getDB();
  let results: T[] = await db.getAll(storeName);
  
  if (filter) {
    results = results.filter(filter);
  }

  if (options?.orderBy) {
    const key = options.orderBy;
    const asc = options.ascending ?? true;
    results.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return asc ? -1 : 1;
      if (aVal > bVal) return asc ? 1 : -1;
      return 0;
    });
  }

  if (options?.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

/**
 * Clear all data (useful for logout).
 */
export async function localClearAll(): Promise<void> {
  const db = await getDB();
  const storeNames = Array.from(db.objectStoreNames);
  const tx = db.transaction(storeNames, "readwrite");
  for (const name of storeNames) {
    tx.objectStore(name).clear();
  }
  await tx.done;
}

/**
 * Export all data as JSON (for backup/migration).
 */
export async function localExportAll(): Promise<Record<string, unknown[]>> {
  const db = await getDB();
  const data: Record<string, unknown[]> = {};
  for (const name of Array.from(db.objectStoreNames)) {
    data[name] = await db.getAll(name);
  }
  return data;
}

/**
 * Import data from JSON (for restore/migration).
 */
export async function localImportAll(data: Record<string, unknown[]>): Promise<void> {
  const db = await getDB();
  for (const [storeName, records] of Object.entries(data)) {
    if (db.objectStoreNames.contains(storeName)) {
      const tx = db.transaction(storeName, "readwrite");
      for (const record of records) {
        tx.store.put(record);
      }
      await tx.done;
    }
  }
}
