import { inventoryRepository } from "../repositories/inventory.repository";
import { toErrorMessage } from "../lib/errors";
import type { InventoryItem, QueryOptions } from "../types";

export const inventoryService = {
  async getAll(options?: QueryOptions): Promise<InventoryItem[]> {
    return inventoryRepository.findAll(options);
  },

  async getById(id: number | string): Promise<InventoryItem | null> {
    return inventoryRepository.findById(id);
  },

  async syncFromProducts(): Promise<{
    data: InventoryItem[];
    error: string | null;
  }> {
    try {
      const data = await inventoryRepository.syncFromProducts();
      return { data, error: null };
    } catch (err) {
      return { data: [], error: toErrorMessage(err) };
    }
  },

  async update(
    id: number | string,
    data: Partial<Omit<InventoryItem, "id">>
  ): Promise<{ data: InventoryItem | null; error: string | null }> {
    try {
      const item = await inventoryRepository.update(id, data);
      return { data: item, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async delete(
    id: number | string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await inventoryRepository.delete(id);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: toErrorMessage(err) };
    }
  },

  async getLowStock(): Promise<InventoryItem[]> {
    return inventoryRepository.findLowStock();
  },

  async getLowStockCount(): Promise<number> {
    const items = await inventoryRepository.findLowStock();
    return items.length;
  },
};