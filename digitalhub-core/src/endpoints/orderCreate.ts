import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class OrderCreate extends OpenAPIRoute {
	schema = {
		tags: ["Orders"],
		summary: "Create Order",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							customer_name: z.string().optional(),
							customer_email: z.string().optional(),
							product_id: z.string(),
							product_name: z.string(),
							quantity: z.number().default(1),
							status: z
								.enum([
									"Pending",
									"Processing",
									"Shipped",
									"Delivered",
								])
								.default("Pending"),
							payment_status: z
								.enum(["pending", "paid", "failed"])
								.default("pending"),
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
		// ── Authentication & Authorization ──
		const secret = c.env.JWT_SECRET;

		if (!secret) {
			return c.json(
				{ success: false, message: "Server misconfiguration" },
				500
			);
		}

		const authHeader = c.req.header("Authorization") ?? "";
		const token = authHeader.replace("Bearer ", "").trim();

		if (!token) {
			return c.json(
				{ success: false, message: "Unauthorized" },
				401
			);
		}

		const payload = await verifyJWT(token, secret);

		if (!payload) {
			return c.json(
				{ success: false, message: "Invalid or expired token" },
				401
			);
		}

		// Check role (Admin or Manager)
		const user = await c.env.DB
			.prepare("SELECT role FROM users WHERE id = ?")
			.bind(payload.sub)
			.first<{ role: string }>();

		if (
			!user ||
			(user.role !== "Admin" && user.role !== "Manager")
		) {
			return c.json(
				{
					success: false,
					message: "Forbidden: Insufficient permissions",
				},
				403
			);
		}

		// ── Validate request body ──
		const data = await this.getValidatedData<typeof this.schema>();
		const order = data.body;

		// ── Validate product exists and has stock ──
		const product = await c.env.DB
			.prepare(
				`SELECT id, name, price, stock
				 FROM products
				 WHERE id = ?`
			)
			.bind(order.product_id)
			.first<{
				id: string;
				name: string;
				price: number;
				stock: number;
			}>();

		if (!product) {
			return c.json(
				{
					success: false,
					message: "Product not found",
				},
				404
			);
		}

		if (product.stock < order.quantity) {
			return c.json(
				{
					success: false,
					message: `Insufficient stock. Available: ${product.stock}`,
				},
				400
			);
		}

		// ── Generate order fields ──
		const id = crypto.randomUUID();

		const orderNumber = `ORD-${Date.now()}-${Math.random()
			.toString(36)
			.substring(2, 7)
			.toUpperCase()}`;

		const unitPrice = product.price;
		const totalPrice = unitPrice * order.quantity;

		// ── Build transaction statements ──
		const statements = [
			c.env.DB
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
						total_price,
						status,
						payment_status
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					id,
					orderNumber,
					order.customer_name ?? "",
					order.customer_email ?? "",
					order.product_id,
					product.name,
					order.quantity,
					unitPrice,
					totalPrice,
					order.status,
					order.payment_status
				),

			c.env.DB
				.prepare(
					`UPDATE products
					 SET stock = stock - ?
					 WHERE id = ?`
				)
				.bind(order.quantity, order.product_id),

			c.env.DB
				.prepare(
					`UPDATE inventory
					 SET quantity = quantity - ?
					 WHERE product_id = ?
					 AND quantity >= ?`
				)
				.bind(
					order.quantity,
					order.product_id,
					order.quantity
				),
		];

		try {
			// Execute all statements as a single transaction via batch
			await c.env.DB.batch(statements);

			return c.json({
				success: true,
				message: "Order created successfully",
				order: {
					id,
					order_number: orderNumber,
					customer_name: order.customer_name ?? "",
					customer_email: order.customer_email ?? "",
					product_id: order.product_id,
					product_name: product.name,
					quantity: order.quantity,
					unit_price: unitPrice,
					total_price: totalPrice,
					status: order.status,
					payment_status: order.payment_status,
				},
			});
		} catch (error) {
			console.error("Order creation failed:", error);

			return c.json(
				{
					success: false,
					message: "Failed to create order",
				},
				500
			);
		}
	}
}