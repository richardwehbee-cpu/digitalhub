import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CategoryUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "Update Category",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name:        z.string().optional(),
              description: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "Category updated successfully" },
      "404": { description: "Category not found" },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;
    const { name, description } = data.body;

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
      .prepare(
        `UPDATE categories
         SET
           name        = COALESCE(?, name),
           description = COALESCE(?, description)
         WHERE id = ?`
      )
      .bind(name ?? null, description ?? null, id)
      .run();

    return c.json({
      success: true,
      message: "Category updated successfully",
    });
  }
}