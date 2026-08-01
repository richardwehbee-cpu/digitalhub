import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CustomerFetch extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "Get Customer By ID",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Customer found",
      },
      "404": {
        description: "Customer not found",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    const customer = await c.env.DB
      .prepare(
        "SELECT id, name, email, phone, city, created_at FROM customers WHERE id = ?"
      )
      .bind(id)
      .first();

    if (!customer) {
      return c.json(
        { success: false, message: "Customer not found" },
        404
      );
    }

    return c.json({ success: true, customer });
  }
}