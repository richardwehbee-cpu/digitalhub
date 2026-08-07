import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyPassword, hashPassword, verifyJWT } from "../lib/crypto";

export class AuthChangePassword extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Change password for the authenticated user",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              currentPassword: z.string().min(1),
              newPassword:     z.string().min(8),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "Password updated successfully" },
      "401": { description: "Unauthorized or incorrect current password" },
      "500": { description: "Server misconfiguration" },
    },
  };

  async handle(c: AppContext) {
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json(
        { success: false, message: "Server misconfiguration: JWT_SECRET not set" },
        500
      );
    }

    // Verify JWT from Authorization header
    const authHeader = c.req.header("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const payload = await verifyJWT(token, secret);
    if (!payload) {
      return c.json({ success: false, message: "Invalid or expired token" }, 401);
    }

    // Read camelCase body
    const data = await this.getValidatedData<typeof this.schema>();
    const { currentPassword, newPassword } = data.body;

    // Load user from DB
    const user = await c.env.DB
      .prepare("SELECT id, password_hash FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ id: string; password_hash: string }>();

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 401);
    }

    // Verify current password
    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      return c.json(
        { success: false, message: "Current password is incorrect" },
        401
      );
    }

    // Hash new password and save
    const newHash = await hashPassword(newPassword);
    await c.env.DB
      .prepare(
        "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(newHash, user.id)
      .run();

    return c.json({
      success: true,
      message: "Password updated successfully",
    });
  }
}