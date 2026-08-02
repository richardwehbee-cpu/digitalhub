import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CategoryRemove extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "Delete Category",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": { description: "Category deleted successfully" },
      "404": { description: "Category not found" },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    const existing = await c.env.DB
      .prepare("SELECT id FROM categories WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return c.json(
        { success: false, message: "Category not found" },
        404
      );
    }

    await c.env.DB
      .prepare("DELETE FROM categories WHERE id = ?")
      .bind(id)
      .run();

    return c.json({
      success: true,
      message: "Category deleted successfully",
    });
  }
}