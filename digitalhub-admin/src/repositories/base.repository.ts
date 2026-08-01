import { lsGet, lsSet, generateId } from "../lib/localStorage";
import { NotFoundError, RepositoryError } from "../lib/errors";
import type { QueryOptions } from "../types";

export interface IRepository<T extends { id: number }> {
  findAll(options?: QueryOptions): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: number, data: Partial<Omit<T, "id">>): Promise<T>;
  delete(id: number): Promise<boolean>;
  count(): Promise<number>;
}

export abstract class BaseLocalStorageRepository<T extends { id: number }>
  implements IRepository<T>
{
  protected abstract readonly storageKey: string;
  protected abstract readonly entityName: string;
  protected abstract readonly defaults: T[];

  protected readAll(): T[] {
    const stored = lsGet<T>(this.storageKey);
    if (stored.length > 0) return stored;
    lsSet(this.storageKey, this.defaults);
    return this.defaults;
  }

  protected writeAll(items: T[]): void {
    const ok = lsSet(this.storageKey, items);
    if (!ok) {
      throw new RepositoryError(
        `Failed to persist ${this.entityName} data.`
      );
    }
  }

  protected applySearch(items: T[], search: string): T[] {
    const q = search.toLowerCase();
    return items.filter((item) =>
      Object.values(item as Record<string, unknown>).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }

  protected applySort(
    items: T[],
    sortBy: string,
    sortOrder: "asc" | "desc"
  ): T[] {
    return [...items].sort((a, b) => {
      const aVal = String(
        (a as Record<string, unknown>)[sortBy] ?? ""
      );
      const bVal = String(
        (b as Record<string, unknown>)[sortBy] ?? ""
      );
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }

  protected applyPagination(
    items: T[],
    page: number,
    pageSize: number
  ): T[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    let items = this.readAll();
    if (options.search) {
      items = this.applySearch(items, options.search);
    }
    if (options.sortBy) {
      items = this.applySort(
        items,
        options.sortBy,
        options.sortOrder ?? "asc"
      );
    }
    if (options.page && options.pageSize) {
      items = this.applyPagination(items, options.page, options.pageSize);
    }
    return items;
  }

  async findById(id: number): Promise<T | null> {
    const items = this.readAll();
    return items.find((item) => item.id === id) ?? null;
  }

  async create(data: Omit<T, "id">): Promise<T> {
    const items = this.readAll();
    const newItem = { ...data, id: generateId() } as T;
    this.writeAll([...items, newItem]);
    return newItem;
  }

  async update(id: number, data: Partial<Omit<T, "id">>): Promise<T> {
    const items = this.readAll();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) throw new NotFoundError(this.entityName, id);
    const updated = { ...items[idx], ...data };
    items[idx] = updated;
    this.writeAll(items);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const items = this.readAll();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) throw new NotFoundError(this.entityName, id);
    items.splice(idx, 1);
    this.writeAll(items);
    return true;
  }

  async count(): Promise<number> {
    return this.readAll().length;
  }
}