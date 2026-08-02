import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class CategoryCreate extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "Create Category",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              id:          z.string(),
              name:        z.string(),
              description: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "Category created successfully" },
      "409": { description: "Category name already exists" },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id, name, description } = data.body;

    const existing = await c.env.DB
      .prepare("SELECT id FROM categories WHERE name = ?")
      .bind(name)
      .first();

    if (existing) {
      return c.json(
        { success: false, message: "A category with this name already exists" },
        409
      );
    }

    await c.env.DB
      .prepare(
        "INSERT INTO categories (id, name, description) VALUES (?, ?, ?)"
      )
      .bind(id, name, description ?? null)
      .run();

    return c.json({
      success: true,
      message: "Category created successfully",
    });
  }
}