import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../services/inventory.service";
import type { InventoryItem } from "../types";

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventoryService.syncFromProducts();
      setInventory(result.data);
      setError(result.error);
    } catch {
      setError("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const update = async (
    id: number,
    data: Partial<Omit<InventoryItem, "id">>
  ): Promise<{ data: InventoryItem | null; error: string | null }> => {
    const result = await inventoryService.update(id, data);
    if (!result.error) await load();
    return result;
  };

  const remove = async (
    id: number
  ): Promise<{ success: boolean; error: string | null }> => {
    const result = await inventoryService.delete(id);
    if (result.success) await load();
    return result;
  };

  return {
    inventory,
    loading,
    error,
    refresh: load,
    update,
    remove,
  };
}