import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../services/inventory.service";
import type { InventoryItem } from "../types";

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await inventoryService.syncFromProducts();
      setInventory(result.data);
      if (result.error) setError(result.error);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load inventory."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (
    id: number | string,
    data: Partial<Omit<InventoryItem, "id">>
  ): Promise<{ data: InventoryItem | null; error: string | null }> => {
    const result = await inventoryService.update(id, data);
    if (!result.error) await load();
    return result;
  };

  const remove = async (
    id: number | string
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