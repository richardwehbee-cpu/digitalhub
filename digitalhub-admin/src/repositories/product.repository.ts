import { apiClient } from "../lib/api";
import { generateUUID } from "../lib/uuid";
import type { Product, QueryOptions } from "../types";

// --- API response shapes ---
interface ProductListResponse {
  success: boolean;
  products: ApiProduct[];
}

interface ProductSingleResponse {
  success: boolean;
  product: ApiProduct;
}

interface ProductMutateResponse {
  success: boolean;
  message: string;
}

// Shape returned by the API (snake_case, active as number)
interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  product_group?: string;
  image?: string;
  cost_price?: number;
  compare_price?: number;
  price: number;
  profit_percent?: number;
  discount_percent?: number;
  region?: string;
  delivery_type?: string;
  stock: number;
  active: number;
}

// Map API shape → admin Product type
function toProduct(p: ApiProduct): Product {
  return {
    id:             p.id,
    name:           p.name,
    category:       p.category ?? "",
    price:          p.price,
    stock:          p.stock,
    image:          p.image ?? "",
  };
}

// Map admin Product → API create/update body
function toApiBody(data: Omit<Product, "id"> & { id?: string }) {
  return {
    id:           data.id ?? generateUUID(),
    name:         data.name,
    category:     data.category,
    image:        data.image || undefined,
    price:        data.price,
    cost_price:   data.price,   // default cost = price until cost_price field is added to admin
    stock:        data.stock,
    active:       1,
    product_group: "",
  };
}

// Apply client-side search / sort / pagination to an array
function applyOptions<T extends Product>(
  items: T[],
  options: QueryOptions
): T[] {
  let result = [...items];

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (options.sortBy) {
    const dir = options.sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const aVal = String((a as Record<string, unknown>)[options.sortBy!] ?? "");
      const bVal = String((b as Record<string, unknown>)[options.sortBy!] ?? "");
      return aVal.localeCompare(bVal, undefined, { numeric: true }) * dir;
    });
  }

  if (options.page && options.pageSize) {
    const start = (options.page - 1) * options.pageSize;
    result = result.slice(start, start + options.pageSize);
  }

  return result;
}

class ProductRepository {
  async findAll(options: QueryOptions = {}): Promise<Product[]> {
    const res = await apiClient.get<ProductListResponse>("/api/products");
    const products = res.products.map(toProduct);
    return applyOptions(products, options);
  }

  async findById(id: string | number): Promise<Product | null> {
    try {
      const res = await apiClient.get<ProductSingleResponse>(
        `/api/products/${id}`
      );
      return toProduct(res.product);
    } catch {
      return null;
    }
  }

  async create(data: Omit<Product, "id">): Promise<Product> {
    const body = toApiBody(data);
    await apiClient.post<ProductMutateResponse>("/api/products", body);
    return { ...data, id: body.id } as Product;
  }

  async update(
    id: string | number,
    data: Partial<Omit<Product, "id">>
  ): Promise<Product> {
    await apiClient.put<ProductMutateResponse>(`/api/products/${id}`, {
      name:     data.name,
      category: data.category,
      image:    data.image,
      price:    data.price,
      stock:    data.stock,
      active:   1,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Product ${id} not found after update`);
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    await apiClient.delete<ProductMutateResponse>(`/api/products/${id}`);
    return true;
  }

  async count(): Promise<number> {
    const res = await apiClient.get<ProductListResponse>("/api/products");
    return res.products.length;
  }

  async findLowStock(threshold = 5): Promise<Product[]> {
    const all = await this.findAll();
    return all
      .filter((p) => p.stock <= threshold)
      .sort((a, b) => a.stock - b.stock);
  }

  async decrementStockByName(
    name: string,
    quantity: number
  ): Promise<Product | null> {
    const all = await this.findAll();
    const product = all.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!product) return null;
    const newStock = Math.max(0, product.stock - quantity);
    return this.update(product.id, { stock: newStock });
  }

  async updateStockByName(
    name: string,
    newStock: number
  ): Promise<Product | null> {
    const all = await this.findAll();
    const product = all.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!product) return null;
    return this.update(product.id, { stock: newStock });
  }
}

export const productRepository = new ProductRepository();