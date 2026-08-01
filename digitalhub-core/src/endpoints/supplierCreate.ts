import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class SupplierCreate extends OpenAPIRoute {
  schema = {
    tags: ["Suppliers"],
    summary: "Create Supplier",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email().optional(),
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
        description: "Supplier created successfully",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id, name, email, phone, company, country } = data.body;

    await c.env.DB
      .prepare(
        "INSERT INTO suppliers (id, name, email, phone, company, country) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        id,
        name,
        email ?? null,
        phone ?? null,
        company ?? null,
        country ?? null
      )
      .run();

    return c.json({
      success: true,
      message: "Supplier created successfully",
    });
  }
}