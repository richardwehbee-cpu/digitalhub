import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class SupplierList extends OpenAPIRoute {
  schema = {
    tags: ["Suppliers"],
    summary: "List Suppliers",
    responses: {
      "200": {
        description: "Returns suppliers",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              suppliers: z.array(z.any()),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const result = await c.env.DB
      .prepare(`
        SELECT
          id,
          name,
          email,
          phone,
          company,
          country,
          created_at
        FROM suppliers
        ORDER BY created_at DESC
      `)
      .all();

    return {
      success: true,
      suppliers: result.results,
    };
  }
}