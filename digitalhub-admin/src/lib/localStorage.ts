// localStorage is still used by Settings, Profile, Login,
// Notifications, and Invoices — those are not API-backed yet.
// Products, Customers, Orders, Suppliers, Inventory, Categories
// now use the API repository instead.

export function lsGet<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {}
  return [];
}

export function lsGetOne<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {}
  return null;
}

export function lsSet(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function lsClear(): void {
  try {
    localStorage.clear();
  } catch {}
}

// UUID generation — kept here for non-API uses (notifications, invoices)
export function generateId(): string {
  return crypto.randomUUID();
}