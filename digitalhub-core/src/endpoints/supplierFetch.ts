import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class SupplierFetch extends OpenAPIRoute {
  schema = {
    tags: ["Suppliers"],
    summary: "Get Supplier By ID",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Supplier found",
      },
      "404": {
        description: "Supplier not found",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    const supplier = await c.env.DB
      .prepare(
        `SELECT
          id,
          name,
          email,
          phone,
          company,
          country,
          created_at
        FROM suppliers
        WHERE id = ?`
      )
      .bind(id)
      .first();

    if (!supplier) {
      return c.json(
        { success: false, message: "Supplier not found" },
        404
      );
    }

    return c.json({ success: true, supplier });
  }
}