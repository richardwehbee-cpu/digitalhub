import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class InventoryList extends OpenAPIRoute {
  schema = {
    tags: ["Inventory"],
    summary: "List inventory records",
    request: {
      query: z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce.number().int().positive().max(100).default(20).optional(),
        product_id: z.string().optional(),
        search: z.string().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Inventory records retrieved successfully",
      },
      "401": {
        description: "Unauthorized",
      },
      "403": {
        description: "Forbidden",
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

    // ── Parse query parameters ──
    const data = await this.getValidatedData<typeof this.schema>();
    const { page = 1, limit = 20, product_id, search } = data.query || {};

    try {
      // Build WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];

      if (product_id) {
        conditions.push("i.product_id = ?");
        params.push(product_id);
      }

      if (search) {
        conditions.push("(p.name LIKE ? OR p.category LIKE ? OR p.product_group LIKE ?)");
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      // Always join products because SELECT references product columns
      const joinClause = `
LEFT JOIN products p
ON i.product_id = p.id
`;

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory i
        ${joinClause}
        ${whereClause}
      `;
      const countResult = await c.env.DB
        .prepare(countQuery)
        .bind(...params)
        .first<{ total: number }>();

      const total = countResult?.total ?? 0;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Fetch inventory records with pagination
      const selectQuery = `
        SELECT
          i.id,
          i.product_id,
          i.quantity,
          i.min_quantity,
          i.warehouse,
          i.updated_at,
          p.name as product_name,
          p.category as product_category,
          p.product_group as product_group
        FROM inventory i
        ${joinClause}
        ${whereClause}
        ORDER BY i.updated_at DESC
        LIMIT ? OFFSET ?
      `;

      const { results } = await c.env.DB
        .prepare(selectQuery)
        .bind(...params, limit, offset)
        .all();

      return c.json({
        success: true,
        inventory: results,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Inventory list failed:", error);
      return c.json(
        { success: false, message: "Failed to fetch inventory records" },
        500
      );
    }
  }
}