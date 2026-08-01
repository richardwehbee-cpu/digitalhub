import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class OrderDelete extends OpenAPIRoute {
  schema = {
    tags: ["Orders"],
    summary: "Delete Order",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Order deleted",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const id = data.params.id;

    // Get order
    const order = await c.env.DB.prepare(
      `
      SELECT product_id, quantity
      FROM orders
      WHERE id = ?
      `
    )
      .bind(id)
      .first<{
        product_id: string;
        quantity: number;
      }>();

    if (!order) {
      return {
        success: false,
        message: "Order not found",
      };
    }

    // Restore inventory
    await c.env.DB.prepare(
      `
      UPDATE inventory
      SET quantity = quantity + ?
      WHERE product_id = ?
      `
    )
      .bind(order.quantity, order.product_id)
      .run();

    // Delete order
    const result = await c.env.DB.prepare(
      `
      DELETE FROM orders
      WHERE id = ?
      `
    )
      .bind(id)
      .run();

    return {
      success: true,
      message: "Order deleted successfully",
      result,
    };
  }
}