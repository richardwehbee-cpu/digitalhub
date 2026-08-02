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
      "404": {
        description: "Product not found",
      },
      "400": {
        description: "Insufficient stock",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const order = data.body;

    // Get product price
    const product = await c.env.DB
      .prepare(
        `SELECT id, name, price, stock FROM products WHERE id = ?`
      )
      .bind(order.product_id)
      .first<{ id: string; name: string; price: number; stock: number }>();

    if (!product) {
      return c.json(
        { success: false, message: "Product not found" },
        404
      );
    }

    // Check stock on products table directly
    // Inventory row is optional — not all products have been synced
    if (product.stock < order.quantity) {
      return c.json(
        {
          success: false,
          message: `Insufficient stock. Available: ${product.stock}`,
        },
        400
      );
    }

    const unitPrice = product.price;
    const totalPrice = unitPrice * order.quantity;

    // Insert order
    await c.env.DB
      .prepare(
        `INSERT INTO orders (
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
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

    // Decrement stock on products table
    await c.env.DB
      .prepare(
        `UPDATE products SET stock = stock - ? WHERE id = ?`
      )
      .bind(order.quantity, order.product_id)
      .run();

    // Decrement inventory row if one exists — best effort, not required
    await c.env.DB
      .prepare(
        `UPDATE inventory SET quantity = quantity - ?
         WHERE product_id = ? AND quantity >= ?`
      )
      .bind(order.quantity, order.product_id, order.quantity)
      .run();

    return c.json({
      success: true,
      message: "Order created successfully",
      order: {
        ...order,
        product_name: product.name,
        unit_price:   unitPrice,
        total_price:  totalPrice,
      },
    });
  }
}