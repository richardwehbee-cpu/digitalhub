import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CustomerUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "Update Customer",
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
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Customer updated successfully",
      },
      "404": {
        description: "Customer not found",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;
    const { name, email, phone, city } = data.body;

    const existing = await c.env.DB
      .prepare("SELECT id FROM customers WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return c.json(
        { success: false, message: "Customer not found" },
        404
      );
    }

    await c.env.DB
      .prepare(
        `UPDATE customers
         SET
           name  = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           city  = COALESCE(?, city)
         WHERE id = ?`
      )
      .bind(name ?? null, email ?? null, phone ?? null, city ?? null, id)
      .run();

    return c.json({
      success: true,
      message: "Customer updated successfully",
    });
  }
}