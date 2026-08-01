import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CustomerCreate extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "Create Customer",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
              phone: z.string().optional(),
              city: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Customer created successfully",
      },
      "409": {
        description: "Email already exists",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id, name, email, phone, city } = data.body;

    const existing = await c.env.DB
      .prepare("SELECT id FROM customers WHERE email = ?")
      .bind(email)
      .first();

    if (existing) {
      return c.json(
        { success: false, message: "A customer with this email already exists" },
        409
      );
    }

    await c.env.DB
      .prepare(
        "INSERT INTO customers (id, name, email, phone, city) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(id, name, email, phone ?? null, city ?? null)
      .run();

    return c.json({
      success: true,
      message: "Customer created successfully",
    });
  }
}