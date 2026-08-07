import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class SupplierUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Suppliers"],
    summary: "Update a supplier",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1, "Supplier name is required").optional(),
              email: z.string().email("Invalid email format").optional(),
              phone: z.string().optional(),
              company: z.string().optional(),
              country: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Supplier updated successfully",
      },
      "400": {
        description: "Bad request",
      },
      "401": {
        description: "Unauthorized",
      },
      "403": {
        description: "Forbidden",
      },
      "404": {
        description: "Supplier not found",
      },
      "409": {
        description: "Supplier name already exists",
      },
      "500": {
        description: "Internal server error",
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

    // Check role (Admin or Manager)
    const user = await c.env.DB
      .prepare("SELECT role FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ role: string }>();

    if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
      return c.json({ success: false, message: "Forbidden: Insufficient permissions" }, 403);
    }

    // ── Validate request ──
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;
    const body = data.body;

    // ── Check if supplier exists ──
    const existing = await c.env.DB
      .prepare("SELECT id, name FROM suppliers WHERE id = ?")
      .bind(id)
      .first<{ id: string; name: string }>();

    if (!existing) {
      return c.json({ success: false, message: "Supplier not found" }, 404);
    }

    // ── Trim fields ──
    const name = body.name?.trim();
    const email = body.email?.trim() ?? null;
    const phone = body.phone?.trim() ?? null;
    const company = body.company?.trim() ?? null;
    const country = body.country?.trim() ?? null;

    // ── If name is changed, check uniqueness ──
    if (name && name !== existing.name) {
      const duplicate = await c.env.DB
        .prepare("SELECT id FROM suppliers WHERE name = ? AND id != ?")
        .bind(name, id)
        .first<{ id: string }>();
      if (duplicate) {
        return c.json({ success: false, message: "Supplier name already exists" }, 409);
      }
    }

    // ── Build dynamic update query ──
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (body.email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (body.phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (body.company !== undefined) {
      updates.push("company = ?");
      values.push(company);
    }
    if (body.country !== undefined) {
      updates.push("country = ?");
      values.push(country);
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400);
    }

    // No updated_at column, so no timestamp update
    values.push(id);

    const query = `UPDATE suppliers SET ${updates.join(", ")} WHERE id = ?`;

    // ── Execute update ──
    try {
      await c.env.DB.prepare(query).bind(...values).run();

      // Fetch updated supplier
      const updated = await c.env.DB
        .prepare(
          `SELECT id, name, email, phone, company, country, created_at
           FROM suppliers WHERE id = ?`
        )
        .bind(id)
        .first();

      return c.json({
        success: true,
        message: "Supplier updated successfully",
        supplier: updated,
      });
    } catch (error) {
      console.error("Supplier update failed:", error);
      return c.json(
        { success: false, message: "Failed to update supplier" },
        500
      );
    }
  }
}