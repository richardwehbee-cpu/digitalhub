import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../types";

export class CategoryList extends OpenAPIRoute {
  schema = {
    tags: ["Categories"],
    summary: "List Categories",
    responses: {
      "200": { description: "List of categories" },
    },
  };

  async handle(c: AppContext) {
    const result = await c.env.DB
      .prepare(
        `SELECT id, name, description, created_at
         FROM categories
         ORDER BY name ASC`
      )
      .all();

    return c.json({
      success: true,
      categories: result.results,
    });
  }
}