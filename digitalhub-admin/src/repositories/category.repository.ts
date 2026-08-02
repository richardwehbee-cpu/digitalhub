import { apiClient } from "../lib/api";
import { generateUUID } from "../lib/uuid";
import type { Category, QueryOptions } from "../types";

interface CategoryListResponse {
  success: boolean;
  categories: ApiCategory[] | null | undefined;
}

interface CategorySingleResponse {
  success: boolean;
  category: ApiCategory;
}

interface CategoryMutateResponse {
  success: boolean;
  message: string;
}

interface ApiCategory {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
}

function toCategory(c: ApiCategory): Category {
  return {
    id:          c.id,
    name:        c.name,
    description: c.description ?? "",
  };
}

function applyOptions<T extends Category>(
  items: T[],
  options: QueryOptions
): T[] {
  let result = [...items];

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }

  if (options.sortBy) {
    const dir = options.sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const aVal = String(
        (a as Record<string, unknown>)[options.sortBy!] ?? ""
      );
      const bVal = String(
        (b as Record<string, unknown>)[options.sortBy!] ?? ""
      );
      return aVal.localeCompare(bVal, undefined, { numeric: true }) * dir;
    });
  }

  if (options.page && options.pageSize) {
    const start = (options.page - 1) * options.pageSize;
    result = result.slice(start, start + options.pageSize);
  }

  return result;
}

class CategoryRepository {
  async findAll(options: QueryOptions = {}): Promise<Category[]> {
    try {
      const res = await apiClient.get<CategoryListResponse>("/api/categories");
      const raw = Array.isArray(res.categories) ? res.categories : [];
      const categories = raw.map(toCategory);
      return applyOptions(categories, options);
    } catch {
      return [];
    }
  }

  async findById(id: string | number): Promise<Category | null> {
    try {
      const res = await apiClient.get<CategorySingleResponse>(
        `/api/categories/${id}`
      );
      if (!res.success || !res.category) return null;
      return toCategory(res.category);
    } catch {
      return null;
    }
  }

  async findByName(name: string): Promise<Category | null> {
    const all = await this.findAll();
    return (
      all.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null
    );
  }

  async getAllNames(): Promise<string[]> {
    const all = await this.findAll();
    return all.map((c) => c.name);
  }

  async create(data: Omit<Category, "id">): Promise<Category> {
    const id = generateUUID();
    await apiClient.post<CategoryMutateResponse>("/api/categories", {
      id,
      name:        data.name,
      description: data.description || undefined,
    });
    return { ...data, id };
  }

  async update(
    id: string | number,
    data: Partial<Omit<Category, "id">>
  ): Promise<Category> {
    await apiClient.put<CategoryMutateResponse>(`/api/categories/${id}`, {
      name:        data.name,
      description: data.description,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Category ${id} not found after update`);
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    await apiClient.delete<CategoryMutateResponse>(`/api/categories/${id}`);
    return true;
  }

  async count(): Promise<number> {
    try {
      const res = await apiClient.get<CategoryListResponse>("/api/categories");
      return Array.isArray(res.categories) ? res.categories.length : 0;
    } catch {
      return 0;
    }
  }
}

export const categoryRepository = new CategoryRepository();