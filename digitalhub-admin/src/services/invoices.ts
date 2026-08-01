export interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  invoiceNumber: string;
  orderId: number;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCity?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Paid" | "Pending" | "Overdue";
  currency: "AUD";
}

const INVOICE_KEY = "digitalhub_invoices";

export function loadInvoices(): Invoice[] {
  try {
    const stored = localStorage.getItem(INVOICE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as Invoice[];
    }
  } catch {}
  return [];
}

export function saveInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
  } catch {}
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${year}${month}-${rand}`;
}

export function createInvoiceFromOrder(order: {
  id: number;
  customerName: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
}, unitPrice: number, customerDetails?: {
  email?: string;
  phone?: string;
  city?: string;
}): Invoice {
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 14);

  const subtotal = unitPrice * order.quantity;
  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  const invoice: Invoice = {
    invoiceNumber: generateInvoiceNumber(),
    orderId: order.id,
    date: now.toLocaleDateString("en-AU"),
    dueDate: due.toLocaleDateString("en-AU"),
    customerName: order.customerName,
    customerEmail: customerDetails?.email ?? "",
    customerPhone: customerDetails?.phone ?? "",
    customerCity: customerDetails?.city ?? "",
    items: [
      {
        productName: order.productName,
        quantity: order.quantity,
        unitPrice,
        total: subtotal,
      },
    ],
    subtotal,
    tax,
    total,
    status: order.status === "Delivered" ? "Paid" : "Pending",
    currency: "AUD",
  };

  return invoice;
}

export function getInvoiceByOrderId(orderId: number): Invoice | undefined {
  return loadInvoices().find((inv) => inv.orderId === orderId);
}

export function upsertInvoice(invoice: Invoice): void {
  const all = loadInvoices();
  const idx = all.findIndex((inv) => inv.orderId === invoice.orderId);
  if (idx >= 0) {
    all[idx] = invoice;
  } else {
    all.unshift(invoice);
  }
  saveInvoices(all);
}