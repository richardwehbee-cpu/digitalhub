import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class OrderDelete extends OpenAPIRoute {
  schema = {
    tags: ["Orders"],
    summary: "Delete Order",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Order deleted",
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

    // ── Fetch order to get product and quantity ──
    const order = await c.env.DB
      .prepare(
        `
        SELECT product_id, quantity
        FROM orders
        WHERE id = ?
        `
      )
      .bind(id)
      .first<{
        product_id: string;
        quantity: number;
      }>();

    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    // ── Build batch statements ──
    const statements: any[] = [];

    // 1. Restore products.stock (required)
    statements.push(
      c.env.DB
        .prepare("UPDATE products SET stock = stock + ? WHERE id = ?")
        .bind(order.quantity, order.product_id)
    );

    // 2. Restore inventory.quantity (best effort — only if inventory row exists)
    statements.push(
      c.env.DB
        .prepare(
          "UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?"
        )
        .bind(order.quantity, order.product_id)
    );

    // 3. Delete order
    statements.push(
      c.env.DB
        .prepare(
          `
          DELETE FROM orders
          WHERE id = ?
          `
        )
        .bind(id)
    );

    // ── Execute all statements in batch ──
    try {
      await c.env.DB.batch(statements);

      return c.json({
        success: true,
        message: "Order deleted successfully",
      });
    } catch (error) {
      console.error("Order deletion failed:", error);
      return c.json(
        { success: false, message: "Failed to delete order" },
        500
      );
    }
  }
}