import { orderRepository } from "../repositories";
import { customerRepository } from "../repositories";
import { addNotification } from "./notifications";
import { productService } from "./product.service";
import {
  createInvoiceFromOrder,
  upsertInvoice,
  getInvoiceByOrderId,
} from "./invoices";
import { toErrorMessage } from "../lib/errors";
import type { Order, QueryOptions } from "../types";

type ProductSales = Record<string, { quantity: number; revenue: number }>;

export const orderService = {
  async getAll(options?: QueryOptions): Promise<Order[]> {
    return orderRepository.findAll(options);
  },

  async getById(id: number): Promise<Order | null> {
    return orderRepository.findById(id);
  },

  async getRecent(limit: number = 5): Promise<Order[]> {
    return orderRepository.getRecentOrders(limit);
  },

  async getTotalRevenue(): Promise<number> {
    return orderRepository.getTotalRevenue();
  },

  async getStatusSummary(): Promise<Record<string, number>> {
    return orderRepository.getStatusSummary();
  },

  async getProductSales(): Promise<ProductSales> {
    return orderRepository.getProductSales();
  },

  async create(
    data: Omit<Order, "id">,
    unitPrice: number
  ): Promise<{ data: Order | null; error: string | null }> {
    try {
      const stockResult = await productService.decrementStockByName(
        data.productName,
        data.quantity
      );
      if (stockResult.error) {
        return { data: null, error: stockResult.error };
      }

      const order = await orderRepository.create(data);

      const customerDetails = await customerRepository
        .findByName(data.customerName)
        .catch(() => null);

      const invoice = createInvoiceFromOrder(
        order,
        unitPrice,
        customerDetails ?? undefined
      );
      upsertInvoice(invoice);

      addNotification(
        "order",
        `New order placed: ${data.productName} for ${data.customerName} ($${data.totalPrice.toFixed(2)}).`
      );

      return { data: order, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async update(
    id: number,
    data: Partial<Omit<Order, "id">>,
    unitPrice?: number
  ): Promise<{ data: Order | null; error: string | null }> {
    try {
      const order = await orderRepository.update(id, data);

      if (unitPrice !== undefined) {
        const existingInvoice = getInvoiceByOrderId(id);
        const customerDetails = await customerRepository
          .findByName(order.customerName)
          .catch(() => null);
        const updatedInvoice = createInvoiceFromOrder(
          order,
          unitPrice,
          customerDetails ?? undefined
        );
        if (existingInvoice) {
          updatedInvoice.invoiceNumber = existingInvoice.invoiceNumber;
        }
        upsertInvoice(updatedInvoice);
      }

      return { data: order, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async delete(
    id: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await orderRepository.delete(id);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: toErrorMessage(err) };
    }
  },

  async count(): Promise<number> {
    return orderRepository.count();
  },
};