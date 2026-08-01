import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class InventoryRemove extends OpenAPIRoute {
  schema = {
    tags: ["Inventory"],
    summary: "Delete Inventory Record",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Inventory record deleted",
      },
      "404": {
        description: "Inventory record not found",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;

    const existing = await c.env.DB
      .prepare("SELECT id FROM inventory WHERE id = ?")
      .bind(id)
      .first();

    if (!existing) {
      return c.json(
        { success: false, message: "Inventory record not found" },
        404
      );
    }

    await c.env.DB
      .prepare("DELETE FROM inventory WHERE id = ?")
      .bind(id)
      .run();

    return c.json({
      success: true,
      message: "Inventory record deleted successfully",
    });
  }
}