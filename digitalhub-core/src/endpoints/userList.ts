import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class UserList extends OpenAPIRoute {
  schema = {
    tags: ["Admin"],
    summary: "List all users (Admin only)",
    responses: {
      "200": { description: "List of users" },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden (not admin)" },
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

    // Check if user is Admin
    const user = await c.env.DB
      .prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ role: string }>();

    if (!user || user.role !== "Admin") {
      return c.json({ success: false, message: "Forbidden: Admin only" }, 403);
    }

    const users = await c.env.DB
      .prepare(
        `SELECT
           id,
           email,
           role,
           full_name,
           phone,
           position,
           username,
           created_at,
           updated_at
         FROM users
         ORDER BY created_at DESC`
      )
      .all<{
        id: string;
        email: string;
        role: string;
        full_name: string | null;
        phone: string | null;
        position: string | null;
        username: string | null;
        created_at: string;
        updated_at: string;
      }>();

    return c.json({
      success: true,
      users: users.results.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        fullName: u.full_name ?? "",
        phone: u.phone ?? "",
        position: u.position ?? "",
        username: u.username ?? u.email?.split("@")[0] ?? "",
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })),
    });
  }
}