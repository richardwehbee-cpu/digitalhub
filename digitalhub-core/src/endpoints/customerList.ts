import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class CustomerList extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "List Customers",
    responses: {
      "200": {
        description: "List of customers",
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

    const result = await c.env.DB
      .prepare(
        `SELECT
            id,
            name,
            email,
            phone,
            country,
            city,
            created_at
         FROM customers
         ORDER BY created_at DESC`
      )
      .all();

    return c.json({
      success: true,
      customers: result.results,
    });
  }
}