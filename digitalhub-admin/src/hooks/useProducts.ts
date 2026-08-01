import { useState, useEffect, useCallback } from "react";
import { productService } from "../services";
import type { Product } from "../types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
      setError(null);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data: Omit<Product, "id">) => {
    const result = await productService.create(data);
    if (!result.error) await load();
    return result;
  };

  const update = async (id: number, data: Partial<Omit<Product, "id">>) => {
    const result = await productService.update(id, data);
    if (!result.error) await load();
    return result;
  };

  const remove = async (id: number) => {
    const result = await productService.delete(id);
    if (result.success) await load();
    return result;
  };

  return { products, loading, error, refresh: load, create, update, remove };
}