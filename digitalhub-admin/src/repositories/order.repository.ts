import { BaseLocalStorageRepository } from "./base.repository";
import type { Order } from "../types";

const STORAGE_KEY = "digitalhub_orders";

const DEFAULT_ORDERS: Order[] = [
  {
    id: 1,
    customerName: "Alice Johnson",
    productName: "Laptop",
    quantity: 1,
    totalPrice: 1200,
    status: "Delivered",
  },
  {
    id: 2,
    customerName: "Bob Smith",
    productName: "Mouse",
    quantity: 3,
    totalPrice: 75,
    status: "Shipped",
  },
  {
    id: 3,
    customerName: "Carol White",
    productName: "Keyboard",
    quantity: 2,
    totalPrice: 90,
    status: "Pending",
  },
];

type StatusSummary = Record<string, number>;
type ProductSales = Record<string, { quantity: number; revenue: number }>;

class OrderRepository extends BaseLocalStorageRepository<Order> {
  protected readonly storageKey = STORAGE_KEY;
  protected readonly entityName = "Order";
  protected readonly defaults = DEFAULT_ORDERS;

  async findByCustomer(customerName: string): Promise<Order[]> {
    const items = this.readAll();
    return items.filter(
      (o) => o.customerName.toLowerCase() === customerName.toLowerCase()
    );
  }

  async findByProduct(productName: string): Promise<Order[]> {
    const items = this.readAll();
    return items.filter(
      (o) => o.productName.toLowerCase() === productName.toLowerCase()
    );
  }

  async findByStatus(status: Order["status"]): Promise<Order[]> {
    const items = this.readAll();
    return items.filter((o) => o.status === status);
  }

  async getTotalRevenue(): Promise<number> {
    const items = this.readAll();
    return items.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  }

  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    const items = this.readAll();
    return [...items].reverse().slice(0, limit);
  }

  async getStatusSummary(): Promise<StatusSummary> {
    const items = this.readAll();
    const result: StatusSummary = {};
    for (const o of items) {
      result[o.status] = (result[o.status] ?? 0) + 1;
    }
    return result;
  }

  async getProductSales(): Promise<ProductSales> {
    const items = this.readAll();
    const result: ProductSales = {};
    for (const o of items) {
      const key = o.productName ?? "Unknown";
      if (!result[key]) {
        result[key] = { quantity: 0, revenue: 0 };
      }
      result[key].quantity += Number(o.quantity) || 0;
      result[key].revenue += Number(o.totalPrice) || 0;
    }
    return result;
  }
}

export const orderRepository = new OrderRepository();