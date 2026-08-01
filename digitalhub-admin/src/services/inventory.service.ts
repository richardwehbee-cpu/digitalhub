import { inventoryRepository } from "../repositories";
import { productRepository } from "../repositories";
import { toErrorMessage } from "../lib/errors";
import type { InventoryItem, QueryOptions } from "../types";

export const inventoryService = {
  async getAll(options?: QueryOptions): Promise<InventoryItem[]> {
    return inventoryRepository.findAll(options);
  },

  async getById(id: number): Promise<InventoryItem | null> {
    return inventoryRepository.findById(id);
  },

  async syncFromProducts(): Promise<{
    data: InventoryItem[];
    error: string | null;
  }> {
    try {
      const products = await productRepository.findAll();
      const synced = await inventoryRepository.syncFromProducts(products);
      return { data: synced, error: null };
    } catch (err) {
      return { data: [], error: toErrorMessage(err) };
    }
  },

  async update(
    id: number,
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
    id: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await inventoryRepository.delete(id);
      await productRepository.delete(id).catch(() => null);
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