import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class InventoryFetch extends OpenAPIRoute {
  schema = {
    tags: ["Inventory"],
    summary: "Fetch an inventory record by ID",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Inventory record found",
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

    // Check role (Admin, Manager, or Viewer)
    const user = await c.env.DB
      .prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ role: string }>();

    if (!user || (user.role !== "Admin" && user.role !== "Manager" && user.role !== "Viewer")) {
      return c.json({ success: false, message: "Forbidden: Insufficient permissions" }, 403);
    }

    // ── Fetch inventory record ──
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    try {
      const inventory = await c.env.DB
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

      if (!inventory) {
        return c.json({ success: false, message: "Inventory record not found" }, 404);
      }

      return c.json({
        success: true,
        inventory,
      });
    } catch (error) {
      console.error("Inventory fetch failed:", error);
      return c.json(
        { success: false, message: "Failed to fetch inventory record" },
        500
      );
    }
  }
}