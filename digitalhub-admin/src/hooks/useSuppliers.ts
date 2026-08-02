import { useState, useEffect, useCallback } from "react";
import { supplierService } from "../services/supplier.service";
import type { Supplier } from "../types";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load suppliers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (
    data: Omit<Supplier, "id">
  ): Promise<{ data: Supplier | null; error: string | null }> => {
    const result = await supplierService.create(data);
    if (!result.error) await load();
    return result;
  };

  const update = async (
    id: number | string,
    data: Partial<Omit<Supplier, "id">>
  ): Promise<{ data: Supplier | null; error: string | null }> => {
    const result = await supplierService.update(id, data);
    if (!result.error) await load();
    return result;
  };

  const remove = async (
    id: number | string
  ): Promise<{ success: boolean; error: string | null }> => {
    const result = await supplierService.delete(id);
    if (result.success) await load();
    return result;
  };

  return {
    suppliers,
    loading,
    error,
    refresh: load,
    create,
    update,
    remove,
  };
}