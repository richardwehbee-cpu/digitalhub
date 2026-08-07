import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class ProductRemove extends OpenAPIRoute {
  schema = {
    tags: ["Products"],
    summary: "Delete Product",
    request: {
      params: z.object({
        id: z.string().min(1, "Product ID is required"),
      }),
    },
    responses: {
      "200": {
        description: "Product deleted",
      },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden" },
      "404": { description: "Product not found" },
      "500": { description: "Internal server error" },
    },
  };

  async handle(c: AppContext) {
    // ── Authentication & Authorization ──
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json(
        { success: false, message: "Server misconfiguration" },
        500
      );
    }

    const authHeader = c.req.header("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const payload = await verifyJWT(token, secret);

    if (!payload) {
      return c.json(
        { success: false, message: "Invalid or expired token" },
        401
      );
    }

    // Check role (Admin or Manager)
    const user = await c.env.DB
      .prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ role: string }>();

    if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
      return c.json(
        {
          success: false,
          message: "Forbidden: Insufficient permissions",
        },
        403
      );
    }

    // ── Validate request ──
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    // Check if product exists
    const existing = await c.env.DB
      .prepare("SELECT id FROM products WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return c.json(
        { success: false, message: "Product not found" },
        404
      );
    }

    try {
      const statements = [
        c.env.DB
          .prepare("DELETE FROM inventory WHERE product_id = ?")
          .bind(id),

        c.env.DB
          .prepare("DELETE FROM products WHERE id = ?")
          .bind(id),
      ];

      await c.env.DB.batch(statements);

      return c.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Product deletion failed:", error);

      return c.json(
        {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to delete product",
        },
        500
      );
    }
  }
}