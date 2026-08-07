import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class CategoryUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "Update a category",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1, "Category name is required").optional(),
              description: z.string().optional(),
              parent_id: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Category updated successfully",
      },
      "400": {
        description: "Bad request",
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
      "409": {
        description: "Category name already exists",
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
    const body = data.body;

    // ── Check if category exists ──
    const existing = await c.env.DB
      .prepare("SELECT id, name FROM categories WHERE id = ?")
      .bind(id)
      .first<{ id: string; name: string }>();

    if (!existing) {
      return c.json({ success: false, message: "Category not found" }, 404);
    }

    // ── Trim fields ──
    const name = body.name?.trim();
    const description = body.description?.trim() ?? null;
    const parent_id = body.parent_id?.trim() ?? null;

    // ── If name is changed, check uniqueness ──
    if (name && name !== existing.name) {
      const duplicate = await c.env.DB
        .prepare("SELECT id FROM categories WHERE name = ? AND id != ?")
        .bind(name, id)
        .first<{ id: string }>();
      if (duplicate) {
        return c.json({ success: false, message: "Category name already exists" }, 409);
      }
    }

    // ── If parent_id is provided, verify parent exists ──
    if (parent_id) {
      const parent = await c.env.DB
        .prepare("SELECT id FROM categories WHERE id = ?")
        .bind(parent_id)
        .first<{ id: string }>();

      if (!parent) {
        return c.json({ success: false, message: "Parent category not found" }, 404);
      }

      // Prevent circular reference (category cannot be its own parent)
      if (parent_id === id) {
        return c.json(
          { success: false, message: "Category cannot be its own parent" },
          400
        );
      }
    }

    // ── Build dynamic update query ──
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }

    if (body.description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (body.parent_id !== undefined) {
      updates.push("parent_id = ?");
      values.push(parent_id);
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }

    const now = new Date().toISOString();
    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const query = `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`;

    // ── Execute update ──
    try {
      await c.env.DB.prepare(query).bind(...values).run();

      // Fetch updated category
      const updated = await c.env.DB
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

      return c.json({
        success: true,
        message: "Category updated successfully",
        category: updated,
      });
    } catch (error) {
      console.error("Category update failed:", error);
      return c.json(
        { success: false, message: "Failed to update category" },
        500
      );
    }
  }
}