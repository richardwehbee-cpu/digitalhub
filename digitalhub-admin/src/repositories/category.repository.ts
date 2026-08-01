import { BaseLocalStorageRepository } from "./base.repository";
import type { Category } from "../types";

const STORAGE_KEY = "digitalhub_categories";

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 1,
    name: "Electronics",
    description: "Laptops, phones, tablets and gadgets",
  },
  {
    id: 2,
    name: "Accessories",
    description: "Mice, keyboards, cables and peripherals",
  },
  {
    id: 3,
    name: "Gift Cards",
    description: "Digital gift cards for various platforms",
  },
];

class CategoryRepository extends BaseLocalStorageRepository<Category> {
  protected readonly storageKey = STORAGE_KEY;
  protected readonly entityName = "Category";
  protected readonly defaults = DEFAULT_CATEGORIES;

  async findByName(name: string): Promise<Category | null> {
    const items = this.readAll();
    return (
      items.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null
    );
  }

  async getAllNames(): Promise<string[]> {
    const items = this.readAll();
    return items.map((c) => c.name);
  }
}

export const categoryRepository = new CategoryRepository();