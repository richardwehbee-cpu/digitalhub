import type { Context } from "hono";
import { z } from "zod";

// Env is declared in worker-configuration.d.ts by wrangler.
// We extend it here with variables not tracked by wrangler bindings.
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

export type AppContext = Context<{ Bindings: Env }>;

// --- Domain Schemas ---

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  product_group: z.string().optional(),
  image: z.string().optional(),
  cost_price: z.number().optional(),
  compare_price: z.number().optional(),
  price: z.number(),
  profit_percent: z.number().default(30),
  discount_percent: z.number().default(0),
  region: z.string().optional(),
  delivery_type: z.string().optional(),
  stock: z.number().default(0),
  active: z.number().default(1),
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
  product_id: z.string(),
  product_name: z.string().optional(),
  quantity: z.number().int().default(1),
  unit_price: z.number().optional(),
  total_price: z.number().optional(),
  status: z
    .enum(["pending", "processing", "shipped", "delivered"])
    .default("pending"),
  payment_status: z
    .enum(["pending", "paid", "failed"])
    .default("pending"),
});

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
});

export const InventorySchema = z.object({
  id: z.string(),
  product_id: z.string(),
  quantity: z.number().int().default(0),
  min_quantity: z.number().int().default(0),
  warehouse: z.string().optional(),
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

// --- Standard response types ---
export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  message: string;
};