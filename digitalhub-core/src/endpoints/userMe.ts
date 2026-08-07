import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class UserMe extends OpenAPIRoute {
  schema = {
    tags: ["User"],
    summary: "Get authenticated user profile",
    responses: {
      "200": { description: "User profile" },
      "401": { description: "Unauthorized" },
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

    const user = await c.env.DB
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
         WHERE id = ?`
      )
      .bind(payload.sub)
      .first<{
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

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 401);
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name ?? "",
        phone: user.phone ?? "",
        position: user.position ?? "",
        username: user.username ?? "",
        lastLogin: user.updated_at ?? user.created_at,
        accountStatus: "Active",
      },
    });
  }
}