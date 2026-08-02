import { apiClient } from "../lib/api";
import { generateUUID } from "../lib/uuid";
import type { Order, QueryOptions } from "../types";

interface OrderListResponse {
  success: boolean;
  orders: ApiOrder[];
}

interface OrderSingleResponse {
  success: boolean;
  order: ApiOrder;
}

interface OrderMutateResponse {
  success: boolean;
  message: string;
}

interface ApiOrder {
  id: string;
  order_number?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  product_id?: string;
  product_name?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total_price?: number | null;
  status?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
}

function normaliseStatus(raw?: string | null): Order["status"] {
  const map: Record<string, Order["status"]> = {
    pending:    "Pending",
    processing: "Processing",
    shipped:    "Shipped",
    delivered:  "Delivered",
  };
  return map[raw?.toLowerCase() ?? ""] ?? "Pending";
}

function toApiStatus(status: Order["status"]): string {
  return status.toLowerCase();
}

function toOrder(o: ApiOrder): Order {
  return {
    id:           o.id,
    customerName: o.customer_name ?? "",
    productName:  o.product_name ?? "",
    quantity:     Number(o.quantity ?? 0),
    totalPrice:   Number(o.total_price ?? 0),
    status:       normaliseStatus(o.status),
  };
}

function applyOptions<T extends Order>(
  items: T[],
  options: QueryOptions
): T[] {
  let result = [...items];

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
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

type StatusSummary = Record<string, number>;
type ProductSales = Record<string, { quantity: number; revenue: number }>;

class OrderRepository {
  async findAll(options: QueryOptions = {}): Promise<Order[]> {
    const res = await apiClient.get<OrderListResponse>("/api/orders");
    if (!res.success || !Array.isArray(res.orders)) return [];
    const orders = res.orders.map(toOrder);
    console.log("[repository] findAll raw count:", res.orders.length, "mapped:", orders.length, orders);
    return applyOptions(orders, options);
  }

  async findById(id: string | number): Promise<Order | null> {
    try {
      const res = await apiClient.get<OrderSingleResponse>(
        `/api/orders/${id}`
      );
      if (!res.success || !res.order) return null;
      return toOrder(res.order);
    } catch {
      return null;
    }
  }

  async findByCustomer(customerName: string): Promise<Order[]> {
    const all = await this.findAll();
    return all.filter(
      (o) => o.customerName.toLowerCase() === customerName.toLowerCase()
    );
  }

  async findByProduct(productName: string): Promise<Order[]> {
    const all = await this.findAll();
    return all.filter(
      (o) => o.productName.toLowerCase() === productName.toLowerCase()
    );
  }

  async findByStatus(status: Order["status"]): Promise<Order[]> {
    const all = await this.findAll();
    return all.filter((o) => o.status === status);
  }

  async getTotalRevenue(): Promise<number> {
    const all = await this.findAll();
    return all.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  }

  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    const all = await this.findAll();
    return [...all].reverse().slice(0, limit);
  }

  async getStatusSummary(): Promise<StatusSummary> {
    const all = await this.findAll();
    const result: StatusSummary = {};
    for (const o of all) {
      result[o.status] = (result[o.status] ?? 0) + 1;
    }
    return result;
  }

  async getProductSales(): Promise<ProductSales> {
    const all = await this.findAll();
    const result: ProductSales = {};
    for (const o of all) {
      const key = o.productName || "Unknown";
      if (!result[key]) result[key] = { quantity: 0, revenue: 0 };
      result[key].quantity += Number(o.quantity) || 0;
      result[key].revenue += Number(o.totalPrice) || 0;
    }
    return result;
  }

  async create(
    data: Omit<Order, "id">,
    unitPrice: number
  ): Promise<Order> {
    const id = generateUUID();
    const orderNumber = `ORD-${Date.now()}`;

    const productsRes = await apiClient.get<{
      success: boolean;
      products: Array<{ id: string; name: string }>;
    }>("/api/products");

    const product = productsRes.products.find(
      (p) => p.name.toLowerCase() === data.productName.toLowerCase()
    );

    if (!product) {
      throw new Error(`Product "${data.productName}" not found in API`);
    }

    await apiClient.post<OrderMutateResponse>("/api/orders", {
      id,
      order_number:   orderNumber,
      customer_name:  data.customerName,
      customer_email: "",
      product_id:     product.id,
      product_name:   data.productName,
      quantity:       data.quantity,
    });

    return {
      id,
      customerName: data.customerName,
      productName:  data.productName,
      quantity:     data.quantity,
      totalPrice:   unitPrice * data.quantity,
      status:       data.status,
    };
  }

  async update(
    id: string | number,
    data: Partial<Omit<Order, "id">>,
    _unitPrice?: number
  ): Promise<Order> {
    await apiClient.put<OrderMutateResponse>(`/api/orders/${id}`, {
      customer_name: data.customerName,
      quantity:      data.quantity,
      status:        data.status ? toApiStatus(data.status) : undefined,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Order ${id} not found after update`);
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    await apiClient.delete<OrderMutateResponse>(`/api/orders/${id}`);
    return true;
  }

  async count(): Promise<number> {
    const res = await apiClient.get<OrderListResponse>("/api/orders");
    if (!res.success || !Array.isArray(res.orders)) return 0;
    return res.orders.length;
  }
}

export const orderRepository = new OrderRepository();