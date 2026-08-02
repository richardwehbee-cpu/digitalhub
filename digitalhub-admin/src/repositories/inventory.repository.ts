import { apiClient } from "../lib/api";
import { generateUUID } from "../lib/uuid";
import type { InventoryItem, QueryOptions } from "../types";

interface InventoryListResponse {
  success: boolean;
  inventory: ApiInventoryItem[] | null | undefined;
}

interface InventorySingleResponse {
  success: boolean;
  item: ApiInventoryItem;
}

interface InventoryMutateResponse {
  success: boolean;
  message: string;
}

interface ApiInventoryItem {
  id: string;
  product_id: string;
  quantity?: number | null;
  min_quantity?: number | null;
  warehouse?: string | null;
  created_at?: string | null;
}

interface ApiProduct {
  id: string;
  name: string;
  category?: string | null;
  stock?: number | null;
}

interface ProductListResponse {
  success: boolean;
  products: ApiProduct[] | null | undefined;
}

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

function deriveStatus(qty: number, min: number): StockStatus {
  if (qty === 0) return "Out of Stock";
  if (qty <= min) return "Low Stock";
  return "In Stock";
}

function buildSku(name: string, category: string, id: string): string {
  const cat = (category ?? "GEN").slice(0, 3).toUpperCase();
  const nam = (name ?? "PRD").slice(0, 3).toUpperCase();
  return `${cat}-${nam}-${id.slice(0, 6).toUpperCase()}`;
}

function toInventoryItem(
  inv: ApiInventoryItem,
  product: ApiProduct
): InventoryItem {
  const qty = Number(inv.quantity ?? 0);
  const min = Number(inv.min_quantity ?? 5);
  return {
    id:                inv.id,
    productName:       product.name ?? "",
    sku:               buildSku(product.name ?? "", product.category ?? "", inv.id),
    category:          product.category ?? "",
    supplier:          "",
    stockQuantity:     qty,
    minimumStock:      min,
    warehouseLocation: inv.warehouse ?? "",
    status:            deriveStatus(qty, min),
  };
}

function applyOptions<T extends InventoryItem>(
  items: T[],
  options: QueryOptions
): T[] {
  let result = [...items];

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (i) =>
        i.productName.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q) ||
        i.warehouseLocation.toLowerCase().includes(q)
    );
  }

  if (options.sortBy) {
    const dir = options.sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const aVal = String(
        (a as Record<string, unknown>)[options.sortBy!] ?? ""
      );
      const bVal = String(
        (b as Record<string, unknown>)[options.sortBy!] ?? ""
      );
      return aVal.localeCompare(bVal, undefined, { numeric: true }) * dir;
    });
  }

  if (options.page && options.pageSize) {
    const start = (options.page - 1) * options.pageSize;
    result = result.slice(start, start + options.pageSize);
  }

  return result;
}

class InventoryRepository {
  async findAll(options: QueryOptions = {}): Promise<InventoryItem[]> {
    let invRes: InventoryListResponse;
    let prodRes: ProductListResponse;

    try {
      [invRes, prodRes] = await Promise.all([
        apiClient.get<InventoryListResponse>("/api/inventory"),
        apiClient.get<ProductListResponse>("/api/products"),
      ]);
    } catch {
      return [];
    }

    const rawInventory = Array.isArray(invRes.inventory)
      ? invRes.inventory
      : [];

    const rawProducts = Array.isArray(prodRes.products)
      ? prodRes.products
      : [];

    if (rawInventory.length === 0) return [];

    const productMap = new Map<string, ApiProduct>(
      rawProducts.map((p) => [p.id, p])
    );

    const items: InventoryItem[] = [];
    for (const inv of rawInventory) {
      if (!inv || !inv.product_id) continue;
      const product = productMap.get(inv.product_id);
      if (!product) continue;
      items.push(toInventoryItem(inv, product));
    }

    return applyOptions(items, options);
  }

  async findById(id: string | number): Promise<InventoryItem | null> {
    try {
      const [invRes, prodRes] = await Promise.all([
        apiClient.get<InventorySingleResponse>(`/api/inventory/${id}`),
        apiClient.get<ProductListResponse>("/api/products"),
      ]);
      if (!invRes.success || !invRes.item) return null;
      const rawProducts = Array.isArray(prodRes.products)
        ? prodRes.products
        : [];
      const product = rawProducts.find(
        (p) => p.id === invRes.item.product_id
      );
      if (!product) return null;
      return toInventoryItem(invRes.item, product);
    } catch {
      return null;
    }
  }

  async findByProductName(productName: string): Promise<InventoryItem | null> {
    const all = await this.findAll();
    return (
      all.find(
        (i) => i.productName.toLowerCase() === productName.toLowerCase()
      ) ?? null
    );
  }

  async findByStatus(status: StockStatus): Promise<InventoryItem[]> {
    const all = await this.findAll();
    return all.filter((i) => i.status === status);
  }

  async findLowStock(): Promise<InventoryItem[]> {
    const all = await this.findAll();
    return all
      .filter(
        (i) => i.status === "Low Stock" || i.status === "Out of Stock"
      )
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }

  async syncFromProducts(): Promise<InventoryItem[]> {
    return this.findAll();
  }

  async update(
    id: string | number,
    data: Partial<Omit<InventoryItem, "id">>
  ): Promise<InventoryItem> {
    await apiClient.put<InventoryMutateResponse>(`/api/inventory/${id}`, {
      quantity:     data.stockQuantity,
      min_quantity: data.minimumStock,
      warehouse:    data.warehouseLocation,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Inventory item ${id} not found after update`);
    return updated;
  }

  async updateStockByProductName(
    productName: string,
    newStock: number
  ): Promise<InventoryItem | null> {
    const item = await this.findByProductName(productName);
    if (!item) return null;
    return this.update(item.id, { stockQuantity: newStock });
  }

  async delete(id: string | number): Promise<boolean> {
    await apiClient.delete<InventoryMutateResponse>(`/api/inventory/${id}`);
    return true;
  }

  async count(): Promise<number> {
    try {
      const res = await apiClient.get<InventoryListResponse>("/api/inventory");
      return Array.isArray(res.inventory) ? res.inventory.length : 0;
    } catch {
      return 0;
    }
  }
}

export const inventoryRepository = new InventoryRepository();

// Keep the generateUUID import used by other repositories
export { generateUUID };