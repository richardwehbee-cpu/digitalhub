import { useState, useEffect, useCallback } from "react";
import { customerService } from "../services/customer.service";
import type { Customer } from "../types";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (
    data: Omit<Customer, "id">
  ): Promise<{ data: Customer | null; error: string | null }> => {
    const result = await customerService.create(data);
    if (!result.error) await load();
    return result;
  };

  const update = async (
    id: number | string,
    data: Partial<Omit<Customer, "id">>
  ): Promise<{ data: Customer | null; error: string | null }> => {
    const result = await customerService.update(id, data);
    if (!result.error) await load();
    return result;
  };

  const remove = async (
    id: number | string
  ): Promise<{ success: boolean; error: string | null }> => {
    const result = await customerService.delete(id);
    if (result.success) await load();
    return result;
  };

  return {
    customers,
    loading,
    error,
    refresh: load,
    create,
    update,
    remove,
  };
}