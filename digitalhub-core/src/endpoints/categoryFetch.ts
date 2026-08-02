import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CategoryFetch extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "Get Category By ID",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": { description: "Category found" },
      "404": { description: "Category not found" },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    const category = await c.env.DB
      .prepare(
        "SELECT id, name, description, created_at FROM categories WHERE id = ?"
      )
      .bind(id)
      .first();

    if (!category) {
      return c.json(
        { success: false, message: "Category not found" },
        404
      );
    }

    return c.json({ success: true, category });
  }
}