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

export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}