import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class UserMeUpdate extends OpenAPIRoute {
  schema = {
    tags: ["User"],
    summary: "Update authenticated user profile",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              fullName: z.string().optional(),
              email: z.string().email().optional(),
              phone: z.string().optional(),
              position: z.string().optional(),
              username: z.string().min(3).optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "Profile updated" },
      "401": { description: "Unauthorized" },
      "409": { description: "Email or username already taken" },
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

    const data = await this.getValidatedData<typeof this.schema>();
    const { fullName, email, phone, position, username } = data.body;

    // Check uniqueness if email provided
    if (email) {
      const existingEmail = await c.env.DB
        .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
        .bind(email, payload.sub)
        .first();
      if (existingEmail) {
        return c.json({ success: false, message: "Email already taken" }, 409);
      }
    }

    // Check uniqueness if username provided
    if (username) {
      const existingUsername = await c.env.DB
        .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
        .bind(username, payload.sub)
        .first();
      if (existingUsername) {
        return c.json({ success: false, message: "Username already taken" }, 409);
      }
    }

    // Build dynamic update query
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
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (position !== undefined) {
      updates.push("position = ?");
      values.push(position);
    }
    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(payload.sub);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...values).run();

    // Fetch updated user
    const updatedUser = await c.env.DB
      .prepare(
        `SELECT id, email, full_name, phone, position, username, role, created_at, updated_at
         FROM users WHERE id = ?`
      )
      .bind(payload.sub)
      .first();

    return c.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  }
}