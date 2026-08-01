import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class OrderCreate extends OpenAPIRoute {
  schema = {
    tags: ["Orders"],
    summary: "Create Order",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              id: z.string(),
              order_number: z.string(),
              customer_name: z.string().optional(),
              customer_email: z.string().optional(),
              product_id: z.string(),
              product_name: z.string(),
              quantity: z.number().default(1),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Order created",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const order = data.body;

    // Get product price
    const product = await c.env.DB
      .prepare(`
        SELECT id, name, price
        FROM products
        WHERE id = ?
      `)
      .bind(order.product_id)
      .first<{
        id: string;
        name: string;
        price: number;
      }>();

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    // Check inventory
    const inventory = await c.env.DB
      .prepare(`
        SELECT id, product_id, quantity
        FROM inventory
        WHERE product_id = ?
      `)
      .bind(order.product_id)
      .first<{
        id: string;
        product_id: string;
        quantity: number;
      }>();

    if (!inventory) {
      return {
        success: false,
        message: "Product not found in inventory",
      };
    }

    if (inventory.quantity < order.quantity) {
      return {
        success: false,
        message: "Insufficient stock",
      };
    }

    const unitPrice = product.price;
    const totalPrice = unitPrice * order.quantity;

    // Create order
    await c.env.DB
      .prepare(`
        INSERT INTO orders (
          id,
          order_number,
          customer_name,
          customer_email,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        order.id,
        order.order_number,
        order.customer_name ?? "",
        order.customer_email ?? "",
        order.product_id,
        product.name,
        order.quantity,
        unitPrice,
        totalPrice
      )
      .run();

    // Update inventory
    await c.env.DB
      .prepare(`
        UPDATE inventory
        SET quantity = quantity - ?
        WHERE product_id = ?
      `)
      .bind(order.quantity, order.product_id)
      .run();

    return {
      success: true,
      message: "Order created successfully",
      order: {
        ...order,
        product_name: product.name,
        unit_price: unitPrice,
        total_price: totalPrice,
      },
    };
  }
}