import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class InventoryUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Inventory"],
    summary: "Update an inventory record",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              quantity: z.number().int().nonnegative("Quantity must be a non-negative integer").optional(),
              min_quantity: z.number().int().nonnegative("Minimum quantity must be a non-negative integer").optional(),
              warehouse: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Inventory record updated successfully",
      },
      "400": {
        description: "Bad request",
      },
      "401": {
        description: "Unauthorized",
      },
      "403": {
        description: "Forbidden",
      },
      "404": {
        description: "Inventory record not found",
      },
      "500": {
        description: "Internal server error",
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
    const { id } = data.params;
    const body = data.body;

    // ── Check if inventory record exists ──
    const existing = await c.env.DB
      .prepare("SELECT id, product_id FROM inventory WHERE id = ?")
      .bind(id)
      .first<{ id: string; product_id: string }>();

    if (!existing) {
      return c.json({ success: false, message: "Inventory record not found" }, 404);
    }

    // ── Build dynamic update query ──
    const updates: string[] = [];
    const values: any[] = [];

    if (body.quantity !== undefined) {
      updates.push("quantity = ?");
      values.push(body.quantity);
    }

    if (body.min_quantity !== undefined) {
      updates.push("min_quantity = ?");
      values.push(body.min_quantity);
    }

    if (body.warehouse !== undefined) {
      updates.push("warehouse = ?");
      values.push(body.warehouse);
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }

    const now = new Date().toISOString();
    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const query = `UPDATE inventory SET ${updates.join(", ")} WHERE id = ?`;

    // ── Execute update ──
    try {
      await c.env.DB.prepare(query).bind(...values).run();

      // Fetch updated record
      const updated = await c.env.DB
        .prepare(
          `SELECT
             id,
             product_id,
             quantity,
             min_quantity,
             warehouse,
             updated_at
           FROM inventory
           WHERE id = ?`
        )
        .bind(id)
        .first();

      return c.json({
        success: true,
        message: "Inventory record updated successfully",
        inventory: updated,
      });
    } catch (error) {
      console.error("Inventory update failed:", error);
      return c.json(
        { success: false, message: "Failed to update inventory record" },
        500
      );
    }
  }
}