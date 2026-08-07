import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class ProductList extends OpenAPIRoute {
	schema = {
		tags: ["Products"],
		summary: "List Products with optional filtering and pagination",
		request: {
			query: z.object({
				page: z.coerce.number().int().positive().default(1).optional(),
				limit: z.coerce.number().int().positive().max(1000).optional(), // ✅ removed default
				category: z.string().optional(),
				active: z.coerce.number().int().min(0).max(1).optional(),
				search: z.string().optional(),
			}),
		},
		responses: {
			"200": {
				description: "Returns products",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							products: z.array(z.any()),
							pagination: z.object({
								page: z.number(),
								limit: z.number(),
								total: z.number(),
								totalPages: z.number(),
							}).optional(), // pagination only if limit is provided
						}),
					},
				},
			},
			"401": { description: "Unauthorized" },
			"403": { description: "Forbidden" },
			"500": { description: "Internal server error" },
		},
	};

	async handle(c: AppContext) {
		// ── Authentication & Authorization ──
		const secret = c.env.JWT_SECRET;
		if (!secret) {
			return c.json({ success: false, message: "Server misconfiguration" }, 500);
		}

		const authHeader = c.req.header("Authorization") ?? "";
		const token = authHeader.replace("Bearer ", "").trim();
		if (!token) {
			return c.json({ success: false, message: "Unauthorized" }, 401);
		}

		const payload = await verifyJWT(token, secret);
		if (!payload) {
			return c.json({ success: false, message: "Invalid or expired token" }, 401);
		}

		// Check role (Admin, Manager, or Viewer)
		const user = await c.env.DB
			.prepare("SELECT role FROM users WHERE id = ?")
			.bind(payload.sub)
			.first<{ role: string }>();

		if (!user) {
			return c.json({ success: false, message: "Unauthorized" }, 401);
		}

		// ── Parse query parameters ──
		const data = await this.getValidatedData<typeof this.schema>();
		const { page = 1, limit, category, active, search } = data.query || {};

		try {
			// Build WHERE clause
			const conditions: string[] = [];
			const params: any[] = [];

			if (category) {
				conditions.push("category = ?");
				params.push(category);
			}
			if (active !== undefined) {
				conditions.push("active = ?");
				params.push(active);
			}
			if (search) {
				conditions.push("(name LIKE ? OR description LIKE ?)");
				params.push(`%${search}%`, `%${search}%`);
			}

			const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

			// Get total count
			const countResult = await c.env.DB
				.prepare(`SELECT COUNT(*) as total FROM products ${whereClause}`)
				.bind(...params)
				.first<{ total: number }>();

			const total = countResult?.total ?? 0;

			// Build the main query
			let query = `
				SELECT
					id,
					name,
					description,
					category,
					product_group,
					image,
					cost_price,
					compare_price,
					price,
					profit_percent,
					discount_percent,
					region,
					delivery_type,
					stock,
					active,
					created_at
				FROM products
				${whereClause}
				ORDER BY created_at DESC
			`;

			// Apply LIMIT only if limit is provided
			if (limit !== undefined && limit !== null) {
				const offset = (page - 1) * limit;
				query += ` LIMIT ? OFFSET ?`;
				params.push(limit, offset);
			}

			const result = await c.env.DB.prepare(query).bind(...params).all();

			// Build response
			const response: any = {
				success: true,
				products: result.results,
			};

			// Include pagination metadata only if limit was provided
			if (limit !== undefined && limit !== null) {
				const totalPages = Math.ceil(total / limit);
				response.pagination = {
					page,
					limit,
					total,
					totalPages,
				};
			}

			return c.json(response);
		} catch (error) {
			console.error("Product list failed:", error);
			return c.json(
				{ success: false, message: "Failed to fetch products" },
				500
			);
		}
	}
}