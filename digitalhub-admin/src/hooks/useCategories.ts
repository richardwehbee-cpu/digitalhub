import { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/category.service";
import type { Category } from "../types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
      setError(null);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (
    data: Omit<Category, "id">
  ): Promise<{ data: Category | null; error: string | null }> => {
    const result = await categoryService.create(data);
    if (!result.error) await load();
    return result;
  };

  const update = async (
    id: number,
    data: Partial<Omit<Category, "id">>
  ): Promise<{ data: Category | null; error: string | null }> => {
    const result = await categoryService.update(id, data);
    if (!result.error) await load();
    return result;
  };

  const remove = async (
    id: number
  ): Promise<{ success: boolean; error: string | null }> => {
    const result = await categoryService.delete(id);
    if (result.success) await load();
    return result;
  };

  return {
    categories,
    loading,
    error,
    refresh: load,
    create,
    update,
    remove,
  };
}