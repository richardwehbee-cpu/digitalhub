import { customerRepository } from "../repositories";
import { addNotification } from "./notifications";
import { toErrorMessage } from "../lib/errors";
import type { Customer, QueryOptions } from "../types";

export const customerService = {
  async getAll(options?: QueryOptions): Promise<Customer[]> {
    return customerRepository.findAll(options);
  },

  async getById(id: number): Promise<Customer | null> {
    return customerRepository.findById(id);
  },

  async getByName(name: string): Promise<Customer | null> {
    return customerRepository.findByName(name);
  },

  async create(
    data: Omit<Customer, "id">
  ): Promise<{ data: Customer | null; error: string | null }> {
    try {
      const customer = await customerRepository.create(data);
      addNotification(
        "customer",
        `New customer added: ${customer.name} from ${customer.city}.`
      );
      return { data: customer, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async update(
    id: number,
    data: Partial<Omit<Customer, "id">>
  ): Promise<{ data: Customer | null; error: string | null }> {
    try {
      const customer = await customerRepository.update(id, data);
      return { data: customer, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async delete(
    id: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await customerRepository.delete(id);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: toErrorMessage(err) };
    }
  },

  async count(): Promise<number> {
    return customerRepository.count();
  },
};