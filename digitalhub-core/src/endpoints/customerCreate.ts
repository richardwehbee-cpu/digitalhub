import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class CustomerCreate extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "Create a new customer",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
              phone: z.string(),
              city: z.string().optional(),
              country: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "Customer created" },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden" },
      "500": { description: "Internal server error" },
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

    const user = await c.env.DB
      .prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ role: string }>();

    if (!user || (user.role !== "Admin" && user.role !== "Manager" && user.role !== "Viewer")) {
      return c.json({ success: false, message: "Forbidden: Insufficient permissions" }, 403);
    }

    // ── Validate request ──
    const data = await this.getValidatedData<typeof this.schema>();
    const customer = data.body;

    const now = new Date().toISOString();

    try {
      await c.env.DB
        .prepare(
          `INSERT INTO customers (id, name, email, phone, city, country, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.city || null,
          customer.country || null,
          now
        )
        .run();

      return c.json({
        success: true,
        message: "Customer created successfully",
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          city: customer.city || null,
          country: customer.country || null,
          created_at: now,
        },
      });
    } catch (error) {
      console.error("Customer creation failed:", error);
      return c.json({ success: false, message: "Failed to create customer" }, 500);
    }
  }
}