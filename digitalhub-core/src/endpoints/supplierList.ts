import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class SupplierList extends OpenAPIRoute {
  schema = {
    tags: ["Suppliers"],
    summary: "List all suppliers",
    request: {
      query: z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce.number().int().positive().max(100).default(20).optional(),
        search: z.string().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Suppliers retrieved successfully",
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
    const { page = 1, limit = 20, search } = data.query || {};

    try {
      // Build WHERE clause for search
      let whereClause = "";
      const params: any[] = [];

      if (search) {
        whereClause = "WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ? OR country LIKE ?";
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern, pattern, pattern);
      }

      // Get total count
      const countResult = await c.env.DB
        .prepare(`SELECT COUNT(*) as total FROM suppliers ${whereClause}`)
        .bind(...params)
        .first<{ total: number }>();

      const total = countResult?.total ?? 0;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Fetch suppliers with pagination
      const { results } = await c.env.DB
        .prepare(
          `SELECT
             id,
             name,
             email,
             phone,
             company,
             country,
             created_at
           FROM suppliers
           ${whereClause}
           ORDER BY name ASC
           LIMIT ? OFFSET ?`
        )
        .bind(...params, limit, offset)
        .all();

      return c.json({
        success: true,
        suppliers: results,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Supplier list failed:", error);
      return c.json(
        { success: false, message: "Failed to fetch suppliers" },
        500
      );
    }
  }
}