import { apiClient } from "../lib/api";
import { generateUUID } from "../lib/uuid";
import type { Supplier, QueryOptions } from "../types";

interface SupplierListResponse {
  success: boolean;
  suppliers: ApiSupplier[];
}

interface SupplierSingleResponse {
  success: boolean;
  supplier: ApiSupplier;
}

interface SupplierMutateResponse {
  success: boolean;
  message: string;
}

interface ApiSupplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  created_at?: string | null;
}

function toSupplier(s: ApiSupplier): Supplier {
  return {
    id:            s.id,
    companyName:   s.company ?? s.name,
    contactPerson: s.name,
    email:         s.email ?? "",
    phone:         s.phone ?? "",
    country:       s.country ?? "",
  };
}

function applyOptions<T extends Supplier>(
  items: T[],
  options: QueryOptions
): T[] {
  let result = [...items];

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.companyName.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q)
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

class SupplierRepository {
  async findAll(options: QueryOptions = {}): Promise<Supplier[]> {
    const res = await apiClient.get<SupplierListResponse>("/api/suppliers");
    if (!res.success || !Array.isArray(res.suppliers)) return [];
    const suppliers = res.suppliers.map(toSupplier);
    return applyOptions(suppliers, options);
  }

  async findById(id: string | number): Promise<Supplier | null> {
    try {
      const res = await apiClient.get<SupplierSingleResponse>(
        `/api/suppliers/${id}`
      );
      if (!res.success || !res.supplier) return null;
      return toSupplier(res.supplier);
    } catch {
      return null;
    }
  }

  async findByCompanyName(name: string): Promise<Supplier | null> {
    const all = await this.findAll();
    return (
      all.find(
        (s) => s.companyName.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  async findByCountry(country: string): Promise<Supplier[]> {
    const all = await this.findAll();
    return all.filter(
      (s) => s.country.toLowerCase() === country.toLowerCase()
    );
  }

  async getAllCompanyNames(): Promise<string[]> {
    const all = await this.findAll();
    return all.map((s) => s.companyName);
  }

  async create(data: Omit<Supplier, "id">): Promise<Supplier> {
    const id = generateUUID();
    await apiClient.post<SupplierMutateResponse>("/api/suppliers", {
      id,
      name:    data.contactPerson,
      email:   data.email || undefined,
      phone:   data.phone || undefined,
      company: data.companyName || undefined,
      country: data.country || undefined,
    });
    return { ...data, id };
  }

  async update(
    id: string | number,
    data: Partial<Omit<Supplier, "id">>
  ): Promise<Supplier> {
    await apiClient.put<SupplierMutateResponse>(`/api/suppliers/${id}`, {
      name:    data.contactPerson,
      email:   data.email,
      phone:   data.phone,
      company: data.companyName,
      country: data.country,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Supplier ${id} not found after update`);
    return updated;
  }

  async delete(id: string | number): Promise<boolean> {
    await apiClient.delete<SupplierMutateResponse>(`/api/suppliers/${id}`);
    return true;
  }

  async count(): Promise<number> {
    const res = await apiClient.get<SupplierListResponse>("/api/suppliers");
    if (!res.success || !Array.isArray(res.suppliers)) return 0;
    return res.suppliers.length;
  }
}

export const supplierRepository = new SupplierRepository();