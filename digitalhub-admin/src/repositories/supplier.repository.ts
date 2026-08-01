import { BaseLocalStorageRepository } from "./base.repository";
import type { Supplier } from "../types";

const STORAGE_KEY = "digitalhub_suppliers";

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    companyName: "TechSource Global",
    contactPerson: "James Lee",
    email: "james@techsource.com",
    phone: "0411111111",
    country: "Australia",
  },
  {
    id: 2,
    companyName: "Manastore",
    contactPerson: "Sara Ahmed",
    email: "sara@manastore.com",
    phone: "0422222222",
    country: "United Arab Emirates",
  },
  {
    id: 3,
    companyName: "FoxReload",
    contactPerson: "Tom Brown",
    email: "tom@foxreload.com",
    phone: "0433333333",
    country: "United Kingdom",
  },
];

class SupplierRepository extends BaseLocalStorageRepository<Supplier> {
  protected readonly storageKey = STORAGE_KEY;
  protected readonly entityName = "Supplier";
  protected readonly defaults = DEFAULT_SUPPLIERS;

  async findByCompanyName(name: string): Promise<Supplier | null> {
    const items = this.readAll();
    return (
      items.find(
        (s) => s.companyName.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  async findByCountry(country: string): Promise<Supplier[]> {
    const items = this.readAll();
    return items.filter(
      (s) => s.country.toLowerCase() === country.toLowerCase()
    );
  }

  async getAllCompanyNames(): Promise<string[]> {
    const items = this.readAll();
    return items.map((s) => s.companyName);
  }
}

export const supplierRepository = new SupplierRepository();