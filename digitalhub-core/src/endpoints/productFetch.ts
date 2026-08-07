import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class ProductFetch extends OpenAPIRoute {
  schema = {
    tags: ["Products"],
    summary: "Fetch Product by ID",
    request: {
      params: z.object({
        id: z.string().min(1, "Product ID is required"),
      }),
    },
    responses: {
      "200": {
        description: "Returns product",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              product: z.any().nullable(),
            }),
          },
        },
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

    // ── Fetch product ──
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    try {
      const product = await c.env.DB
        .prepare(`
          SELECT
            id,
            name,
            description,
            category,
            product_group,
            image,
            cost_price,
            compare_price,
            price,
            profit_percent,
            discount_percent,
            region,
            delivery_type,
            stock,
            active,
            created_at
          FROM products
          WHERE id = ?
        `)
        .bind(id)
        .first();

      if (!product) {
        return c.json({ success: false, message: "Product not found" }, 404);
      }

      return c.json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("PRODUCT FETCH ERROR:", error);
      return c.json(
        { success: false, message: "Failed to fetch product" },
        500
      );
    }
  }
}