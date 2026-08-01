import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../types";

export class CustomerList extends OpenAPIRoute {
  schema = {
    tags: ["Customers"],
    summary: "List Customers",
    responses: {
      "200": {
        description: "List of customers",
      },
    },
  };

  async handle(c: AppContext) {
    const result = await c.env.DB
      .prepare(
        `SELECT id, name, email, phone, city, created_at
         FROM customers
         ORDER BY created_at DESC`
      )
      .all();

    return c.json({
      success: true,
      customers: result.results,
    });
  }
}