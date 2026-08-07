import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class CategoryList extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "List all categories",
    request: {
      query: z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce.number().int().positive().max(100).default(20).optional(),
        search: z.string().optional(),
        parent_id: z.string().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Categories retrieved successfully",
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
    const { page = 1, limit = 20, search, parent_id } = data.query || {};

    try {
      // Build WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];

      if (search) {
        conditions.push("(name LIKE ? OR description LIKE ?)");
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      if (parent_id !== undefined && parent_id !== null) {
        conditions.push("parent_id = ?");
        params.push(parent_id);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get total count
      const countResult = await c.env.DB
        .prepare(`SELECT COUNT(*) as total FROM categories ${whereClause}`)
        .bind(...params)
        .first<{ total: number }>();

      const total = countResult?.total ?? 0;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Fetch categories with pagination
      const { results } = await c.env.DB
        .prepare(
          `SELECT
             id,
             name,
             description,
             parent_id,
             created_at,
             updated_at
           FROM categories
           ${whereClause}
           ORDER BY name ASC
           LIMIT ? OFFSET ?`
        )
        .bind(...params, limit, offset)
        .all();

      return c.json({
        success: true,
        categories: results,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Category list failed:", error);
      return c.json(
        { success: false, message: "Failed to fetch categories" },
        500
      );
    }
  }
}