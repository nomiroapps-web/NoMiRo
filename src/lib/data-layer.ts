/**
 * Unified Data Layer
 * 
 * Abstracts data operations behind a common interface.
 * Routes to either Supabase (cloud) or IndexedDB (local) based on config.
 * 
 * Usage:
 *   import { dataLayer } from "@/lib/data-layer";
 *   const families = await dataLayer.from("families").select().eq("owner_id", userId);
 */

import { isLocalMode } from "./backend-config";
import { supabase } from "@/integrations/supabase/client";
import {
  localInsert,
  localUpdate,
  localDelete,
  localGetById,
  localQuery,
  localGetByIndex,
} from "./local-db";

type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "like";
type Filter = { column: string; op: FilterOp; value: unknown };
type OrderSpec = { column: string; ascending: boolean };

interface QueryResult<T = any> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

interface SingleResult<T = any> {
  data: T | null;
  error: Error | null;
}

/**
 * Chain-able query builder that works with both Supabase and IndexedDB.
 */
class QueryBuilder<T = any> {
  private table: string;
  private filters: Filter[] = [];
  private orders: OrderSpec[] = [];
  private limitCount: number | null = null;
  private columns: string = "*";
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = "*"): this {
    this.mode = "select";
    this.columns = columns;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this.mode = "insert";
    this.payload = data;
    return this;
  }

  update(data: Record<string, unknown>): this {
    this.mode = "update";
    this.payload = data;
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, op: "gt", value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, op: "lt", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, op: "lte", value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}): this {
    this.orders.push({ column, ascending });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  async single(): Promise<SingleResult<T>> {
    const result = await this.execute();
    if (result.error) return { data: null, error: result.error };
    return {
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: result.data && result.data.length === 0 ? new Error("No rows found") : null,
    };
  }

  async execute(): Promise<QueryResult<T>> {
    if (isLocalMode()) {
      return this.executeLocal();
    }
    return this.executeCloud();
  }

  // Alias for execute — matches the pattern: await dataLayer.from("x").select()
  async then(
    resolve: (value: QueryResult<T>) => void,
    reject?: (reason: unknown) => void
  ) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
    }
  }

  private async executeLocal(): Promise<QueryResult<T>> {
    try {
      switch (this.mode) {
        case "select": {
          const filter = this.buildLocalFilter();
          let results = await localQuery<T>(this.table, filter);

          for (const ord of this.orders) {
            results.sort((a: any, b: any) => {
              if (a[ord.column] < b[ord.column]) return ord.ascending ? -1 : 1;
              if (a[ord.column] > b[ord.column]) return ord.ascending ? 1 : -1;
              return 0;
            });
          }

          if (this.limitCount) results = results.slice(0, this.limitCount);
          return { data: results, error: null };
        }

        case "insert": {
          const records = Array.isArray(this.payload) ? this.payload : [this.payload!];
          const inserted: T[] = [];
          for (const record of records) {
            const result = await localInsert(this.table, record as any);
            inserted.push(result as unknown as T);
          }
          return { data: inserted, error: null };
        }

        case "update": {
          const eqFilter = this.filters.find((f) => f.op === "eq" && f.column === "id");
          if (eqFilter) {
            await localUpdate(this.table, eqFilter.value as string, this.payload as Record<string, unknown>);
            const updated = await localGetById<T>(this.table, eqFilter.value as string);
            return { data: updated ? [updated] : [], error: null };
          }
          // Bulk update by filter
          const filter = this.buildLocalFilter();
          const matches = await localQuery<any>(this.table, filter);
          for (const match of matches) {
            await localUpdate(this.table, match.id, this.payload as Record<string, unknown>);
          }
          return { data: matches as T[], error: null };
        }

        case "delete": {
          const eqF = this.filters.find((f) => f.op === "eq" && f.column === "id");
          if (eqF) {
            await localDelete(this.table, eqF.value as string);
            return { data: [], error: null };
          }
          const deleteFilter = this.buildLocalFilter();
          const toDelete = await localQuery<any>(this.table, deleteFilter);
          for (const item of toDelete) {
            await localDelete(this.table, item.id);
          }
          return { data: [], error: null };
        }

        default:
          return { data: null, error: new Error(`Unknown mode: ${this.mode}`) };
      }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  private async executeCloud(): Promise<QueryResult<T>> {
    try {
      let query: any;

      switch (this.mode) {
        case "select":
          query = supabase.from(this.table as any).select(this.columns);
          break;
        case "insert":
          query = supabase.from(this.table as any).insert(this.payload as any).select();
          break;
        case "update":
          query = supabase.from(this.table as any).update(this.payload as any);
          break;
        case "delete":
          query = supabase.from(this.table as any).delete();
          break;
      }

      // Apply filters
      for (const f of this.filters) {
        switch (f.op) {
          case "eq": query = query.eq(f.column, f.value); break;
          case "neq": query = query.neq(f.column, f.value); break;
          case "gt": query = query.gt(f.column, f.value); break;
          case "gte": query = query.gte(f.column, f.value); break;
          case "lt": query = query.lt(f.column, f.value); break;
          case "lte": query = query.lte(f.column, f.value); break;
          case "in": query = query.in(f.column, f.value as unknown[]); break;
          case "like": query = query.like(f.column, f.value); break;
        }
      }

      // Apply ordering
      for (const ord of this.orders) {
        query = query.order(ord.column, { ascending: ord.ascending });
      }

      // Apply limit
      if (this.limitCount) {
        query = query.limit(this.limitCount);
      }

      // For update/delete, add select to return data
      if (this.mode === "update" || this.mode === "delete") {
        query = query.select();
      }

      const { data, error } = await query;
      return { data, error };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  private buildLocalFilter(): ((record: any) => boolean) | undefined {
    if (this.filters.length === 0) return undefined;

    return (record: any) => {
      return this.filters.every((f) => {
        const val = record[f.column];
        switch (f.op) {
          case "eq": return val === f.value;
          case "neq": return val !== f.value;
          case "gt": return val > (f.value as any);
          case "gte": return val >= (f.value as any);
          case "lt": return val < (f.value as any);
          case "lte": return val <= (f.value as any);
          case "in": return (f.value as unknown[]).includes(val);
          case "like": return String(val).includes(String(f.value).replace(/%/g, ""));
          default: return true;
        }
      });
    };
  }
}

/**
 * Main data layer entry point.
 */
export const dataLayer = {
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  },
};
