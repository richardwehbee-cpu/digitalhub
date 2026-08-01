import { BaseLocalStorageRepository } from "./base.repository";
import type { Product } from "../types";

const STORAGE_KEY = "digitalhub_products";

const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: "Laptop", category: "Electronics", price: 1200, stock: 15, image: "" },
  { id: 2, name: "Mouse", category: "Accessories", price: 25, stock: 80, image: "" },
  { id: 3, name: "Keyboard", category: "Accessories", price: 45, stock: 40, image: "" },
];

class ProductRepository extends BaseLocalStorageRepository<Product> {
  protected readonly storageKey = STORAGE_KEY;
  protected readonly entityName = "Product";
  protected readonly defaults = DEFAULT_PRODUCTS;

  async findByName(name: string): Promise<Product | null> {
    const items = this.readAll();
    return items.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null;
  }

  async findByCategory(category: string): Promise<Product[]> {
    const items = this.readAll();
    return items.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  async findLowStock(threshold = 5): Promise<Product[]> {
    const items = this.readAll();
    return items.filter((p) => p.stock <= threshold).sort((a, b) => a.stock - b.stock);
  }

  async decrementStock(id: number, quantity: number): Promise<Product> {
    const item = await this.findById(id);
    if (!item) throw new Error(`Product ${id} not found`);
    const newStock = Math.max(0, item.stock - quantity);
    return this.update(id, { stock: newStock });
  }

  async decrementStockByName(name: string, quantity: number): Promise<Product | null> {
    const items = this.readAll();
    const idx = items.findIndex((p) => p.name === name);
    if (idx === -1) return null;
    const newStock = Math.max(0, items[idx].stock - quantity);
    items[idx] = { ...items[idx], stock: newStock };
    this.writeAll(items);
    return items[idx];
  }

  async updateStockByName(name: string, newStock: number): Promise<Product | null> {
    const items = this.readAll();
    const idx = items.findIndex((p) => p.name === name);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], stock: newStock };
    this.writeAll(items);
    return items[idx];
  }
}

export const productRepository = new ProductRepository();