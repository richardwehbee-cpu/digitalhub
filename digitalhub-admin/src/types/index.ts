export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
}

export interface Order {
  id: number;
  customerName: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered";
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface InventoryItem {
  id: number;
  productName: string;
  sku: string;
  category: string;
  supplier: string;
  stockQuantity: number;
  minimumStock: number;
  warehouseLocation: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface Supplier {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
}

export interface QueryOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}