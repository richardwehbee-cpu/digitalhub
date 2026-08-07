import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class InventoryRemove extends OpenAPIRoute {
  schema = {
    tags: ["Inventory"],
    summary: "Delete an inventory record",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Inventory record deleted successfully",
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

    // ── Check if inventory record exists ──
    const existing = await c.env.DB
      .prepare("SELECT id FROM inventory WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return c.json({ success: false, message: "Inventory record not found" }, 404);
    }

    // ── Delete inventory record ──
    try {
      await c.env.DB
        .prepare("DELETE FROM inventory WHERE id = ?")
        .bind(id)
        .run();

      return c.json({
        success: true,
        message: "Inventory record deleted successfully",
      });
    } catch (error) {
      console.error("Inventory deletion failed:", error);
      return c.json(
        { success: false, message: "Failed to delete inventory record" },
        500
      );
    }
  }
}