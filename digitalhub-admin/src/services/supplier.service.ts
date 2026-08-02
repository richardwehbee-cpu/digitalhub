import { supplierRepository } from "../repositories/supplier.repository";
import { toErrorMessage } from "../lib/errors";
import type { Supplier, QueryOptions } from "../types";

export const supplierService = {
  async getAll(options?: QueryOptions): Promise<Supplier[]> {
    return supplierRepository.findAll(options);
  },

  async getById(id: number | string): Promise<Supplier | null> {
    return supplierRepository.findById(id);
  },

  async getAllCompanyNames(): Promise<string[]> {
    return supplierRepository.getAllCompanyNames();
  },

  async create(
    data: Omit<Supplier, "id">
  ): Promise<{ data: Supplier | null; error: string | null }> {
    try {
      const supplier = await supplierRepository.create(data);
      return { data: supplier, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async update(
    id: number | string,
    data: Partial<Omit<Supplier, "id">>
  ): Promise<{ data: Supplier | null; error: string | null }> {
    try {
      const supplier = await supplierRepository.update(id, data);
      return { data: supplier, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async delete(
    id: number | string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await supplierRepository.delete(id);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: toErrorMessage(err) };
    }
  },

  async count(): Promise<number> {
    return supplierRepository.count();
  },
};