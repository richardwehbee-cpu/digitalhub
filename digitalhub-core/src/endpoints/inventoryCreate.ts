import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class InventoryCreate extends OpenAPIRoute {
	schema = {
		tags: ["Inventory"],
		summary: "Create a new inventory record",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							product_id: z.string().uuid("Invalid product ID format"),
							quantity: z
								.number()
								.int()
								.nonnegative(
									"Quantity must be a non-negative integer"
								),
							min_quantity: z
								.number()
								.int()
								.nonnegative(
									"Minimum quantity must be a non-negative integer"
								)
								.optional(),
							warehouse: z.string().optional(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Inventory record created successfully",
			},
			"400": {
				description: "Bad request",
			},
			"401": {
				description: "Unauthorized",
			},
			"403": {
				description: "Forbidden",
			},
			"404": {
				description: "Product not found",
			},
			"409": {
				description: "Inventory record already exists for this product",
			},
			"500": {
				description: "Internal server error",
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
		const inventory = data.body;

		// ── Check if product exists ──
		const product = await c.env.DB
			.prepare("SELECT id FROM products WHERE id = ?")
			.bind(inventory.product_id)
			.first<{ id: string }>();

		if (!product) {
			return c.json(
				{
					success: false,
					message: "Product not found",
				},
				404
			);
		}

		// ── Check if inventory record already exists for this product ──
		const existing = await c.env.DB
			.prepare("SELECT id FROM inventory WHERE product_id = ?")
			.bind(inventory.product_id)
			.first<{ id: string }>();

		if (existing) {
			return c.json(
				{
					success: false,
					message:
						"Inventory record already exists for this product",
				},
				409
			);
		}

		// ── Generate ID and timestamp ──
		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		// ── Insert inventory record ──
		try {
			await c.env.DB
				.prepare(
					`INSERT INTO inventory (
						id,
						product_id,
						quantity,
						min_quantity,
						warehouse,
						updated_at
					)
					VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					id,
					inventory.product_id,
					inventory.quantity,
					inventory.min_quantity ?? null,
					inventory.warehouse ?? null,
					now
				)
				.run();

			return c.json({
				success: true,
				message: "Inventory record created successfully",
				inventory: {
					id,
					product_id: inventory.product_id,
					quantity: inventory.quantity,
					min_quantity: inventory.min_quantity ?? null,
					warehouse: inventory.warehouse ?? null,
					updated_at: now,
				},
			});
		} catch (error) {
			console.error("Inventory creation failed:", error);

			return c.json(
				{
					success: false,
					message: "Failed to create inventory record",
				},
				500
			);
		}
	}
}