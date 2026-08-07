import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class OrderUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Orders"],
    summary: "Update Order",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              customer_name: z.string().optional(),
              customer_email: z.string().optional(),
              quantity: z.number().int().optional(),
              status: z
                .enum(["Pending", "Processing", "Shipped", "Delivered"])
                .optional(),
              payment_status: z
                .enum(["pending", "paid", "failed"])
                .optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Order updated successfully",
      },
      "404": {
        description: "Order not found",
      },
    },
  };

  async handle(c: AppContext) {
    // ── Authentication & Authorization ──
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ success: false, message: "Server misconfiguration" }, 500);
    }

    const authHeader = c.req.header("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const payload = await verifyJWT(token, secret);
    if (!payload) {
      return c.json({ success: false, message: "Invalid or expired token" }, 401);
    }

    // Check role (Admin or Manager)
    const user = await c.env.DB
      .prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ role: string }>();

    if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
      return c.json({ success: false, message: "Forbidden: Insufficient permissions" }, 403);
    }

    // ── Validate request ──
    const data = await this.getValidatedData<typeof this.schema>();
    const id = data.params.id;
    const body = data.body;

    // ── Fetch existing order ──
    const order = await c.env.DB
      .prepare("SELECT product_id, quantity, customer_name, customer_email FROM orders WHERE id = ?")
      .bind(id)
      .first<{
        product_id: string;
        quantity: number;
        customer_name: string;
        customer_email: string;
      }>();

    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    const newQuantity = body.quantity ?? order.quantity;
    const difference = newQuantity - order.quantity;

    // ── Fetch product ──
    const product = await c.env.DB
      .prepare("SELECT name, price, stock FROM products WHERE id = ?")
      .bind(order.product_id)
      .first<{ name: string; price: number; stock: number }>();

    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    // ── Validate stock using products.stock ──
    if (difference > 0 && product.stock < difference) {
      return c.json(
        {
          success: false,
          message: `Insufficient stock. Available: ${product.stock}`,
        },
        400
      );
    }

    // ── Build batch statements ──
    const statements: any[] = [];

    // 1. Update products.stock (required)
    if (difference !== 0) {
      statements.push(
        c.env.DB
          .prepare("UPDATE products SET stock = stock - ? WHERE id = ?")
          .bind(difference, order.product_id)
      );
    }

    // 2. Update inventory.quantity (best effort)
    if (difference !== 0) {
      statements.push(
        c.env.DB
          .prepare(
            `UPDATE inventory SET quantity = quantity - ?
             WHERE product_id = ? AND quantity >= ?`
          )
          .bind(difference, order.product_id, difference)
      );
    }

    // 3. Update order
    const unitPrice = product.price;
    const totalPrice = unitPrice * newQuantity;
    const now = new Date().toISOString();

    statements.push(
      c.env.DB
        .prepare(
          `UPDATE orders SET
            customer_name  = COALESCE(?, customer_name),
            customer_email = COALESCE(?, customer_email),
            quantity       = ?,
            product_name   = ?,
            unit_price     = ?,
            total_price    = ?,
            status         = COALESCE(?, status),
            payment_status = COALESCE(?, payment_status),
            updated_at     = ?
          WHERE id = ?`
        )
        .bind(
          body.customer_name ?? null,
          body.customer_email ?? null,
          newQuantity,
          product.name,
          unitPrice,
          totalPrice,
          body.status ?? null,
          body.payment_status ?? null,
          now,
          id
        )
    );

    // ── Execute all statements in batch ──
    try {
      await c.env.DB.batch(statements);

      return c.json({
        success: true,
        message: "Order updated successfully",
      });
    } catch (error) {
      console.error("Order update failed:", error);
      return c.json(
        { success: false, message: "Failed to update order" },
        500
      );
    }
  }
}