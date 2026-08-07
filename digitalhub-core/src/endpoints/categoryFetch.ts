import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class CategoryFetch extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "Fetch a category by ID",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Category found",
      },
      "401": {
        description: "Unauthorized",
      },
      "403": {
        description: "Forbidden",
      },
      "404": {
        description: "Category not found",
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

    // ── Fetch category ──
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    try {
      const category = await c.env.DB
        .prepare(
          `SELECT
             id,
             name,
             description,
             parent_id,
             created_at,
             updated_at
           FROM categories
           WHERE id = ?`
        )
        .bind(id)
        .first();

      if (!category) {
        return c.json({ success: false, message: "Category not found" }, 404);
      }

      return c.json({
        success: true,
        category,
      });
    } catch (error) {
      console.error("Category fetch failed:", error);
      return c.json(
        { success: false, message: "Failed to fetch category" },
        500
      );
    }
  }
}