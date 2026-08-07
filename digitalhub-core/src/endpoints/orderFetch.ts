import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class OrderFetch extends OpenAPIRoute {
  schema = {
    tags: ["Orders"],
    summary: "Get Order By ID",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Order found",
      },
      "404": {
        description: "Order not found",
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

    // ── Fetch order ──
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    try {
      const order = await c.env.DB
        .prepare(
          `SELECT * FROM orders WHERE id = ?`
        )
        .bind(id)
        .first();

      if (!order) {
        return c.json({ success: false, message: "Order not found" }, 404);
      }

      return c.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("Order fetch failed:", error);
      return c.json(
        { success: false, message: "Failed to fetch order" },
        500
      );
    }
  }
}