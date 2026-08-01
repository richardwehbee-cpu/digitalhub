import { categoryRepository } from "../repositories";
import { toErrorMessage } from "../lib/errors";
import type { Category, QueryOptions } from "../types";

export const categoryService = {
  async getAll(options?: QueryOptions): Promise<Category[]> {
    return categoryRepository.findAll(options);
  },

  async getById(id: number): Promise<Category | null> {
    return categoryRepository.findById(id);
  },

  async getAllNames(): Promise<string[]> {
    return categoryRepository.getAllNames();
  },

  async create(
    data: Omit<Category, "id">
  ): Promise<{ data: Category | null; error: string | null }> {
    try {
      const category = await categoryRepository.create(data);
      return { data: category, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async update(
    id: number,
    data: Partial<Omit<Category, "id">>
  ): Promise<{ data: Category | null; error: string | null }> {
    try {
      const category = await categoryRepository.update(id, data);
      return { data: category, error: null };
    } catch (err) {
      return { data: null, error: toErrorMessage(err) };
    }
  },

  async delete(
    id: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await categoryRepository.delete(id);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: toErrorMessage(err) };
    }
  },

  async count(): Promise<number> {
    return categoryRepository.count();
  },
};