import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class SupplierRemove extends OpenAPIRoute {
  schema = {
    tags: ["Suppliers"],
    summary: "Delete a supplier",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Supplier deleted successfully",
      },
      "401": {
        description: "Unauthorized",
      },
      "403": {
        description: "Forbidden",
      },
      "404": {
        description: "Supplier not found",
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

    // ── Check if supplier exists ──
    const existing = await c.env.DB
      .prepare("SELECT id FROM suppliers WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return c.json({ success: false, message: "Supplier not found" }, 404);
    }

    // ── Delete supplier ──
    try {
      await c.env.DB
        .prepare("DELETE FROM suppliers WHERE id = ?")
        .bind(id)
        .run();

      return c.json({
        success: true,
        message: "Supplier deleted successfully",
      });
    } catch (error) {
      console.error("Supplier deletion failed:", error);
      return c.json(
        { success: false, message: "Failed to delete supplier" },
        500
      );
    }
  }
}