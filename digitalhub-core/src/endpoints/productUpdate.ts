import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class ProductUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Products"],
    summary: "Update Product",
    request: {
      params: z.object({
        id: z.string().min(1, "Product ID is required"),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().optional(),
              description: z.string().optional(),
              category: z.string().optional(),
              product_group: z.string().optional(),
              image: z.string().optional(),
              cost_price: z.number().nonnegative().optional(),
              compare_price: z.number().optional(),
              price: z.number().nonnegative().optional(),
              profit_percent: z.number().optional(),
              discount_percent: z.number().optional(),
              region: z.string().optional(),
              delivery_type: z.string().optional(),
              stock: z.number().int().nonnegative().optional(),
              active: z.number().int().min(0).max(1).optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Product updated",
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
    const updates = data.body;

    // ── Check if product exists ──
    const existing = await c.env.DB
      .prepare("SELECT id FROM products WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    // ── Build dynamic update query ──
    const fields: string[] = [];
    const values: any[] = [];

    // Map request fields to database columns (no updated_at)
    const fieldMap: Record<string, string> = {
      name: "name",
      description: "description",
      category: "category",
      product_group: "product_group",
      image: "image",
      cost_price: "cost_price",
      compare_price: "compare_price",
      price: "price",
      profit_percent: "profit_percent",
      discount_percent: "discount_percent",
      region: "region",
      delivery_type: "delivery_type",
      stock: "stock",
      active: "active",
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key as keyof typeof updates] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(updates[key as keyof typeof updates]);
      }
    }

    if (fields.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }

    // No updated_at column; simply apply the updates
    values.push(id); // for WHERE clause

    const query = `UPDATE products SET ${fields.join(", ")} WHERE id = ?`;

    try {
      await c.env.DB.prepare(query).bind(...values).run();

      // Fetch updated product (without updated_at)
      const updated = await c.env.DB
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

      return c.json({
        success: true,
        message: "Product updated successfully",
        product: updated,
      });
    } catch (error) {
      console.error("Product update failed:", error);
      return c.json(
        { success: false, message: "Failed to update product" },
        500
      );
    }
  }
}