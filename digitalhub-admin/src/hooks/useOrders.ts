import { useState, useEffect, useCallback } from "react";
import { orderService } from "../services/order.service";
import type { Order } from "../types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      setOrders(data);
      setError(null);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (
    data: Omit<Order, "id">,
    unitPrice: number
  ): Promise<{ data: Order | null; error: string | null }> => {
    const result = await orderService.create(data, unitPrice);
    if (!result.error) await load();
    return result;
  };

  const update = async (
    id: number,
    data: Partial<Omit<Order, "id">>,
    unitPrice?: number
  ): Promise<{ data: Order | null; error: string | null }> => {
    const result = await orderService.update(id, data, unitPrice);
    if (!result.error) await load();
    return result;
  };

  const remove = async (
    id: number
  ): Promise<{ success: boolean; error: string | null }> => {
    const result = await orderService.delete(id);
    if (result.success) await load();
    return result;
  };

  return {
    orders,
    loading,
    error,
    refresh: load,
    create,
    update,
    remove,
  };
}