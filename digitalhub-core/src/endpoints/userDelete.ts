import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class UserDelete extends OpenAPIRoute {
  schema = {
    tags: ["Admin"],
    summary: "Delete a user by ID (Admin only)",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      "200": { description: "User deleted" },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden" },
      "404": { description: "User not found" },
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

    // Don't allow deleting yourself
    if (id === payload.sub) {
      return c.json({ success: false, message: "Cannot delete your own account" }, 400);
    }

    const existing = await c.env.DB
      .prepare("SELECT id FROM users WHERE id = ?")
      .bind(id)
      .first();
    if (!existing) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    await c.env.DB
      .prepare("DELETE FROM users WHERE id = ?")
      .bind(id)
      .run();

    return c.json({ success: true, message: "User deleted successfully" });
  }
}