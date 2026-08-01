import { productRepository } from "../repositories/product.repository";
import { inventoryRepository } from "../repositories/inventory.repository";
import { addNotification } from "./notifications";
import { toErrorMessage } from "../lib/errors";
import type { Product, QueryOptions } from "../types";

export const productService = {
  async getAll(options?: QueryOptions): Promise<Product[]> {
    return productRepository.findAll(options);
  },

  async getById(id: number): Promise<Product | null> {
    return productRepository.findById(id);
  },

  async create(
    data: Omit<Product, "id">
  ): Promise<{ data: Product | null; error: string | null }> {
    try {
      const product = await productRepository.create(data);
      if (product.stock === 0) {
        addNotification(
          "out_of_stock",
          `New product "${product.name}" added with zero stock.`
        );
      } else if (product.stock <= 5) {
        addNotification(
          "low_stock",
          `New product "${product.name}" added with low stock (${product.stock} unit(s)).`
        );
      }
      return { data: product, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async update(
    id: number,
    data: Partial<Omit<Product, "id">>
  ): Promise<{ data: Product | null; error: string | null }> {
    try {
      const product = await productRepository.update(id, data);
      return { data: product, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async delete(
    id: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await productRepository.delete(id);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: toErrorMessage(err) };
    }
  },

  async getLowStock(threshold = 5): Promise<Product[]> {
    return productRepository.findLowStock(threshold);
  },

  async decrementStockByName(
    name: string,
    quantity: number
  ): Promise<{ data: Product | null; error: string | null }> {
    try {
      const product = await productRepository.decrementStockByName(
        name,
        quantity
      );
      if (!product) {
        return { data: null, error: `Product "${name}" not found.` };
      }

      await inventoryRepository.updateStockByProductName(
        name,
        product.stock
      );

      if (product.stock === 0) {
        addNotification(
          "out_of_stock",
          `"${name}" is now out of stock.`
        );
      } else if (product.stock <= 5) {
        addNotification(
          "low_stock",
          `Low stock alert: "${name}" has only ${product.stock} unit(s) left.`
        );
      }

      return { data: product, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },
};