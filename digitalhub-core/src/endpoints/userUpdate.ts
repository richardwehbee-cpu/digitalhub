import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT, hashPassword } from "../lib/crypto";

export class UserUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Admin"],
    summary: "Update a user by ID (Admin only)",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              fullName: z.string().optional(),
              email: z.string().email().optional(),
              username: z.string().min(3).optional(),
              phone: z.string().optional(),
              position: z.string().optional(),
              role: z.enum(["Admin", "Manager", "Viewer"]).optional(),
              password: z.string().min(8).optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "User updated" },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden" },
      "404": { description: "User not found" },
      "409": { description: "Email or username already exists" },
    },
  };

  async handle(c: AppContext) {
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

    // Check Admin role
    const currentUser = await c.env.DB
      .prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ role: string }>();

    if (!currentUser || currentUser.role !== "Admin") {
      return c.json({ success: false, message: "Forbidden: Admin only" }, 403);
    }

    const { id } = c.req.param();
    const data = await this.getValidatedData<typeof this.schema>();
    const { fullName, email, username, phone, position, role, password } = data.body;

    // Check if user exists
    const existing = await c.env.DB
      .prepare("SELECT id FROM users WHERE id = ?")
      .bind(id)
      .first();
    if (!existing) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    // Check email uniqueness if provided
    if (email) {
      const emailExists = await c.env.DB
        .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
        .bind(email, id)
        .first();
      if (emailExists) {
        return c.json({ success: false, message: "Email already exists" }, 409);
      }
    }

    // Check username uniqueness if provided
    if (username) {
      const usernameExists = await c.env.DB
        .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
        .bind(username, id)
        .first();
      if (usernameExists) {
        return c.json({ success: false, message: "Username already taken" }, 409);
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (fullName !== undefined) {
      updates.push("full_name = ?");
      values.push(fullName);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (position !== undefined) {
      updates.push("position = ?");
      values.push(position);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }
    if (password !== undefined) {
      const hashed = await hashPassword(password);
      updates.push("password_hash = ?");
      values.push(hashed);
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...values).run();

    // Fetch updated user
    const updatedUser = await c.env.DB
      .prepare(
        `SELECT id, email, full_name, phone, position, username, role, created_at, updated_at
         FROM users WHERE id = ?`
      )
      .bind(id)
      .first();

    return c.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  }
}