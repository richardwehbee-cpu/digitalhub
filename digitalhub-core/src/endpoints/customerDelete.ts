import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CustomerDelete extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "Delete Customer",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Customer deleted successfully",
      },
      "404": {
        description: "Customer not found",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

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
      .prepare("DELETE FROM customers WHERE id = ?")
      .bind(id)
      .run();

    return c.json({
      success: true,
      message: "Customer deleted successfully",
    });
  }
}