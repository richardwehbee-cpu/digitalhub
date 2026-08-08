import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class CategoryCreate extends OpenAPIRoute {
	schema = {
		tags: ["Categories"],
		summary: "Create a new category",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: z.string().min(1, "Category name is required"),
							description: z.string().optional(),
							parent_id: z.string().optional(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Category created successfully",
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
			"409": {
				description: "Category already exists",
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
		const category = data.body;

		// ── Trim and validate parent_id if provided ──
		const name = category.name.trim();
		const description = category.description?.trim() ?? null;
		const parent_id = category.parent_id?.trim() ?? null;

		// ── Check if category with same name already exists ──
		const existing = await c.env.DB
			.prepare("SELECT id FROM categories WHERE name = ?")
			.bind(name)
			.first<{ id: string }>();

		if (existing) {
			return c.json(
				{
					success: false,
					message: "Category already exists",
				},
				409
			);
		}

		// ── If parent_id is provided, verify parent exists ──
		if (parent_id) {
			const parent = await c.env.DB
				.prepare("SELECT id FROM categories WHERE id = ?")
				.bind(parent_id)
				.first<{ id: string }>();

			if (!parent) {
				return c.json(
					{
						success: false,
						message: "Parent category not found",
					},
					404
				);
			}
		}

		// ── Generate ID and timestamps ──
		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		// ── Insert category ──
		try {
			await c.env.DB
				.prepare(
					`INSERT INTO categories (
						id,
						name,
						description,
						parent_id,
						created_at,
						updated_at
					)
					VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					id,
					name,
					description,
					parent_id,
					now,
					now
				)
				.run();

			return c.json({
				success: true,
				message: "Category created successfully",
				category: {
					id,
					name,
					description,
					parent_id,
					created_at: now,
					updated_at: now,
				},
			});
		} catch (error) {
			console.error("Category creation failed:", error);

			return c.json(
				{
					success: false,
					message: "Failed to create category",
				},
				500
			);
		}
	}
}