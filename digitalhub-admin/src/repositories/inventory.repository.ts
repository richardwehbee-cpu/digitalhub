import { BaseLocalStorageRepository } from "./base.repository";
import type { InventoryItem } from "../types";

const STORAGE_KEY = "digitalhub_inventory";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

function deriveStatus(stockQuantity: number, minimumStock: number): StockStatus {
  if (stockQuantity === 0) return "Out of Stock";
  if (stockQuantity <= minimumStock) return "Low Stock";
  return "In Stock";
}

function buildSku(name: string, category: string, id: number): string {
  const cat = category.slice(0, 3).toUpperCase();
  const nam = name.slice(0, 3).toUpperCase();
  return `${cat}-${nam}-${String(id).padStart(3, "0")}`;
}

type ProductLike = {
  id: number;
  name: string;
  category: string;
  stock: number;
};

class InventoryRepository extends BaseLocalStorageRepository<InventoryItem> {
  protected readonly storageKey = STORAGE_KEY;
  protected readonly entityName = "InventoryItem";
  protected readonly defaults: InventoryItem[] = [];

  async findByProductName(productName: string): Promise<InventoryItem | null> {
    const items = this.readAll();
    return (
      items.find(
        (i) => i.productName.toLowerCase() === productName.toLowerCase()
      ) ?? null
    );
  }

  async findByStatus(status: StockStatus): Promise<InventoryItem[]> {
    const items = this.readAll();
    return items.filter((i) => i.status === status);
  }

  async findLowStock(): Promise<InventoryItem[]> {
    const items = this.readAll();
    return items
      .filter(
        (i) => i.status === "Low Stock" || i.status === "Out of Stock"
      )
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }

  async updateStockByProductName(
    productName: string,
    newStock: number
  ): Promise<InventoryItem | null> {
    const items = this.readAll();
    const idx = items.findIndex((i) => i.productName === productName);
    if (idx === -1) return null;
    items[idx] = {
      ...items[idx],
      stockQuantity: newStock,
      status: deriveStatus(newStock, items[idx].minimumStock),
    };
    this.writeAll(items);
    return items[idx];
  }

  async syncFromProducts(products: ProductLike[]): Promise<InventoryItem[]> {
    const existing = this.readAll();
    const synced: InventoryItem[] = products.map((product) => {
      const found = existing.find(
        (i) => i.id === product.id || i.productName === product.name
      );
      const minimumStock = found?.minimumStock ?? 5;
      return {
        id: product.id,
        productName: product.name,
        sku:
          found?.sku ??
          buildSku(product.name, product.category, product.id),
        category: product.category,
        supplier: found?.supplier ?? "",
        stockQuantity: product.stock,
        minimumStock,
        warehouseLocation: found?.warehouseLocation ?? "",
        status: deriveStatus(product.stock, minimumStock),
      };
    });
    this.writeAll(synced);
    return synced;
  }
}

export const inventoryRepository = new InventoryRepository();