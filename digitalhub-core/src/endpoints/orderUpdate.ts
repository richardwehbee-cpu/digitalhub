import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

type OrderRow = {
  product_id: string;
  quantity: number;
  customer_name: string;
  customer_email: string;
};

type ProductRow = {
  name: string;
  price: number;
};

type InventoryRow = {
  quantity: number;
};

export class OrderUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Orders"],
    summary: "Update Order",
    request: {
      params: z.object({
        id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              customer_name: z.string().optional(),
              customer_email: z.string().optional(),
              quantity: z.number().int().optional(),
              status: z
                .enum(["pending", "processing", "shipped", "delivered"])
                .optional(),
              payment_status: z
                .enum(["pending", "paid", "failed"])
                .optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Order updated successfully",
      },
      "404": {
        description: "Order not found",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const id = data.params.id;
    const body = data.body;

    const order = await c.env.DB
      .prepare("SELECT product_id, quantity, customer_name, customer_email FROM orders WHERE id = ?")
      .bind(id)
      .first<OrderRow>();

    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    const newQuantity = body.quantity ?? order.quantity;
    const difference = newQuantity - order.quantity;

    const product = await c.env.DB
      .prepare("SELECT name, price FROM products WHERE id = ?")
      .bind(order.product_id)
      .first<ProductRow>();

    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    if (difference > 0) {
      const inventory = await c.env.DB
        .prepare("SELECT quantity FROM inventory WHERE product_id = ?")
        .bind(order.product_id)
        .first<InventoryRow>();

      if (!inventory || inventory.quantity < difference) {
        return c.json({ success: false, message: "Insufficient stock" }, 400);
      }

      await c.env.DB
        .prepare("UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?")
        .bind(difference, order.product_id)
        .run();
    } else if (difference < 0) {
      await c.env.DB
        .prepare("UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?")
        .bind(Math.abs(difference), order.product_id)
        .run();
    }

    const unitPrice = product.price;
    const totalPrice = unitPrice * newQuantity;

    await c.env.DB
      .prepare(
        `UPDATE orders SET
          customer_name  = COALESCE(?, customer_name),
          customer_email = COALESCE(?, customer_email),
          quantity       = ?,
          product_name   = ?,
          unit_price     = ?,
          total_price    = ?,
          status         = COALESCE(?, status),
          payment_status = COALESCE(?, payment_status)
        WHERE id = ?`
      )
      .bind(
        body.customer_name ?? null,
        body.customer_email ?? null,
        newQuantity,
        product.name,
        unitPrice,
        totalPrice,
        body.status ?? null,
        body.payment_status ?? null,
        id
      )
      .run();

    return c.json({
      success: true,
      message: "Order updated successfully",
    });
  }
}