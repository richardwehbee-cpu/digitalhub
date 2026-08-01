import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class ProductFetch extends OpenAPIRoute {
  schema = {
    tags: ["Products"],
    summary: "Fetch Product",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Returns product",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              product: z.any().nullable(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    const result = await c.env.DB
      .prepare(`
        SELECT
          id,
          name,
          description,
          price,
          stock,
          active,
          created_at
        FROM products
        WHERE id = ?
      `)
      .bind(id)
      .first();

    return {
      success: true,
      product: result,
    };
  }
}