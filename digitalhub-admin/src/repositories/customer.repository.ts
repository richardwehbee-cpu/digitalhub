import { apiClient } from "../lib/api";
import { generateUUID } from "../lib/uuid";
import type { Customer, QueryOptions } from "../types";

interface CustomerListResponse {
  success: boolean;
  customers: ApiCustomer[];
}

interface CustomerSingleResponse {
  success: boolean;
  customer: ApiCustomer;
}

interface CustomerMutateResponse {
  success: boolean;
  message: string;
}

interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  created_at?: string;
}

function toCustomer(c: ApiCustomer): Customer {
  return {
    id:    c.id,
    name:  c.name,
    email: c.email,
    phone: c.phone ?? "",
    city:  c.city ?? "",
  };
}

function applyOptions<T extends Customer>(
  items: T[],
  options: QueryOptions
): T[] {
  let result = [...items];

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
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

class CustomerRepository {
  async findAll(options: QueryOptions = {}): Promise<Customer[]> {
    const res = await apiClient.get<CustomerListResponse>("/api/customers");
    const customers = res.customers.map(toCustomer);
    return applyOptions(customers, options);
  }

  async findById(id: string | number): Promise<Customer | null> {
    try {
      const res = await apiClient.get<CustomerSingleResponse>(
        `/api/customers/${id}`
      );
      return toCustomer(res.customer);
    } catch {
      return null;
    }
  }

  async findByName(name: string): Promise<Customer | null> {
    const all = await this.findAll();
    return (
      all.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null
    );
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const all = await this.findAll();
    return (
      all.find(
        (c) => c.email.toLowerCase() === email.toLowerCase()
      ) ?? null
    );
  }

  async findByCity(city: string): Promise<Customer[]> {
    const all = await this.findAll();
    return all.filter(
      (c) => c.city.toLowerCase() === city.toLowerCase()
    );
  }

  async create(data: Omit<Customer, "id">): Promise<Customer> {
    const id = generateUUID();
    await apiClient.post<CustomerMutateResponse>("/api/customers", {
      id,
      name:  data.name,
      email: data.email,
      phone: data.phone || undefined,
      city:  data.city || undefined,
    });
    return { ...data, id };
  }

  async update(
    id: string | number,
    data: Partial<Omit<Customer, "id">>
  ): Promise<Customer> {
    await apiClient.put<CustomerMutateResponse>(
      `/api/customers/${id}`,
      {
        name:  data.name,
        email: data.email,
        phone: data.phone,
        city:  data.city,
      }
    );
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Customer ${id} not found after update`);
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    await apiClient.delete<CustomerMutateResponse>(
      `/api/customers/${id}`
    );
    return true;
  }

  async count(): Promise<number> {
    const res = await apiClient.get<CustomerListResponse>("/api/customers");
    return res.customers.length;
  }
}

export const customerRepository = new CustomerRepository();