export interface Notification {
  id: number;
  type: "order" | "customer" | "low_stock" | "out_of_stock" | "info";
  message: string;
  time: string;
  read: boolean;
}

const NOTIF_KEY = "digitalhub_notifications";

export function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as Notification[];
    }
  } catch {}
  return [];
}

export function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  } catch {}
}

export function addNotification(
  type: Notification["type"],
  message: string
): void {
  const existing = loadNotifications();
  const duplicate = existing.find((n) => n.message === message && !n.read);
  if (duplicate) return;
  const newNotif: Notification = {
    id: Date.now(),
    type,
    message,
    time: new Date().toLocaleString("en-AU"),
    read: false,
  };
  const updated = [newNotif, ...existing].slice(0, 50);
  saveNotifications(updated);
  window.dispatchEvent(new Event("digitalhub_notifications_updated"));
}

export function markAllRead(): void {
  const existing = loadNotifications();
  const updated = existing.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  window.dispatchEvent(new Event("digitalhub_notifications_updated"));
}

export function markOneRead(id: number): void {
  const existing = loadNotifications();
  const updated = existing.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
  window.dispatchEvent(new Event("digitalhub_notifications_updated"));
}

export function clearAllNotifications(): void {
  saveNotifications([]);
  window.dispatchEvent(new Event("digitalhub_notifications_updated"));
}