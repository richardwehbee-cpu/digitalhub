import { BaseLocalStorageRepository } from "./base.repository";
import type { Customer } from "../types";

const STORAGE_KEY = "digitalhub_customers";

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "0411111111",
    city: "Sydney",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    phone: "0422222222",
    city: "Melbourne",
  },
  {
    id: 3,
    name: "Carol White",
    email: "carol@example.com",
    phone: "0433333333",
    city: "Brisbane",
  },
];

class CustomerRepository extends BaseLocalStorageRepository<Customer> {
  protected readonly storageKey = STORAGE_KEY;
  protected readonly entityName = "Customer";
  protected readonly defaults = DEFAULT_CUSTOMERS;

  async findByEmail(email: string): Promise<Customer | null> {
    const items = this.readAll();
    return (
      items.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null
    );
  }

  async findByName(name: string): Promise<Customer | null> {
    const items = this.readAll();
    return (
      items.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null
    );
  }

  async findByCity(city: string): Promise<Customer[]> {
    const items = this.readAll();
    return items.filter(
      (c) => c.city.toLowerCase() === city.toLowerCase()
    );
  }
}

export const customerRepository = new CustomerRepository();