import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class CustomerUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "Update a customer",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().optional(),
              email: z.string().email().optional(),
              phone: z.string().optional(),
              city: z.string().optional(),
              country: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "Customer updated" },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden" },
      "404": { description: "Customer not found" },
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
    const { id } = data.params;
    const body = data.body;

    // Check if customer exists
    const existing = await c.env.DB
      .prepare("SELECT id FROM customers WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return c.json({ success: false, message: "Customer not found" }, 404);
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name);
    }
    if (body.email !== undefined) {
      updates.push("email = ?");
      values.push(body.email);
    }
    if (body.phone !== undefined) {
      updates.push("phone = ?");
      values.push(body.phone);
    }
    if (body.city !== undefined) {
      updates.push("city = ?");
      values.push(body.city);
    }
    if (body.country !== undefined) {
      updates.push("country = ?");
      values.push(body.country);
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }

    values.push(id);

    const query = `UPDATE customers SET ${updates.join(", ")} WHERE id = ?`;

    try {
      await c.env.DB.prepare(query).bind(...values).run();

      // Fetch updated customer
      const updated = await c.env.DB
        .prepare(
          `SELECT id, name, email, phone, city, country, created_at
           FROM customers
           WHERE id = ?`
        )
        .bind(id)
        .first();

      return c.json({
        success: true,
        message: "Customer updated successfully",
        customer: updated,
      });
    } catch (error) {
      console.error("Customer update failed:", error);
      return c.json({ success: false, message: "Failed to update customer" }, 500);
    }
  }
}