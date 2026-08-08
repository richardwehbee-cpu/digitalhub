import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class ProductCreate extends OpenAPIRoute {
	schema = {
		tags: ["Products"],
		summary: "Create Product",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: z.string().min(1, "Name is required"),
							description: z.string().optional(),
							category: z.string().min(1, "Category is required"),
							product_group: z.string().min(1, "Product group is required"),
							image: z.string().optional(),
							cost_price: z.number().nonnegative().optional(),
							compare_price: z.number().optional(),
							price: z.number().nonnegative(),
							profit_percent: z.number().default(30),
							discount_percent: z.number().default(0),
							region: z.string().optional(),
							delivery_type: z.string().optional(),
							stock: z.number().int().nonnegative(),
							active: z.number().int().min(0).max(1).default(1),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Product created",
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

		if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
			return c.json(
				{ success: false, message: "Forbidden: Insufficient permissions" },
				403
			);
		}

		// ── Manual request body parsing ──
		let raw: any;

		try {
			raw = await c.req.json();
		} catch {
			return c.json(
				{ success: false, message: "Invalid JSON body" },
				400
			);
		}

		// Define required fields
		const requiredFields = [
			"name",
			"category",
			"product_group",
			"price",
			"stock",
		];

		const missing = requiredFields.filter(
			(f) =>
				raw[f] === undefined ||
				raw[f] === null ||
				raw[f] === ""
		);

		if (missing.length) {
			return c.json(
				{
					success: false,
					message: `Missing required fields: ${missing.join(", ")}`,
				},
				400
			);
		}

		// ── Type conversions ──
		const product: any = {};

		product.name = String(raw.name).trim();

		product.description =
			raw.description !== undefined && raw.description !== null
				? String(raw.description).trim()
				: "";

		product.category = String(raw.category).trim();
		product.product_group = String(raw.product_group).trim();

		product.image =
			raw.image !== undefined && raw.image !== null
				? String(raw.image)
				: "";

		product.region =
			raw.region !== undefined && raw.region !== null
				? String(raw.region)
				: "";

		product.delivery_type =
			raw.delivery_type !== undefined && raw.delivery_type !== null
				? String(raw.delivery_type)
				: "";

		// ── Numeric fields ──
		const priceNum = Number(raw.price);

		if (isNaN(priceNum) || priceNum < 0) {
			return c.json(
				{
					success: false,
					message: "Price must be a non-negative number",
				},
				400
			);
		}

		product.price = priceNum;

		const stockNum = Number(raw.stock);

		if (
			isNaN(stockNum) ||
			!Number.isInteger(stockNum) ||
			stockNum < 0
		) {
			return c.json(
				{
					success: false,
					message: "Stock must be a non-negative integer",
				},
				400
			);
		}

		product.stock = stockNum;

		// ── Optional numeric fields ──
		if (
			raw.cost_price !== undefined &&
			raw.cost_price !== null
		) {
			const cost = Number(raw.cost_price);

			if (!isNaN(cost) && cost >= 0) {
				product.cost_price = cost;
			} else {
				product.cost_price = product.price;
			}
		} else {
			product.cost_price = product.price;
		}

		if (
			raw.compare_price !== undefined &&
			raw.compare_price !== null
		) {
			const compare = Number(raw.compare_price);

			if (!isNaN(compare) && compare >= 0) {
				product.compare_price = compare;
			} else {
				product.compare_price = null;
			}
		} else {
			product.compare_price = null;
		}

		product.profit_percent =
			raw.profit_percent !== undefined &&
			!isNaN(Number(raw.profit_percent))
				? Number(raw.profit_percent)
				: 30;

		product.discount_percent =
			raw.discount_percent !== undefined &&
			!isNaN(Number(raw.discount_percent))
				? Number(raw.discount_percent)
				: 0;

		if (raw.active !== undefined && raw.active !== null) {
			const activeNum = Number(raw.active);

			product.active =
				activeNum === 0 || activeNum === 1
					? activeNum
					: 1;
		} else {
			product.active = 1;
		}

		// ── Validate required fields after trim ──
		if (!product.name) {
			return c.json(
				{
					success: false,
					message: "Name cannot be empty",
				},
				400
			);
		}

		if (!product.category) {
			return c.json(
				{
					success: false,
					message: "Category cannot be empty",
				},
				400
			);
		}

		if (!product.product_group) {
			return c.json(
				{
					success: false,
					message: "Product group cannot be empty",
				},
				400
			);
		}

		// ── Generate IDs and timestamps ──
		const productId = crypto.randomUUID();
		const now = new Date().toISOString();

		// ── Check if category exists ──
		const categoryName = product.category;

		const existingCategory = await c.env.DB
			.prepare("SELECT id FROM categories WHERE name = ?")
			.bind(categoryName)
			.first<{ id: string }>();

		let categoryInsertStmt: any = null;

		if (!existingCategory) {
			const categoryId = crypto.randomUUID();

			categoryInsertStmt = c.env.DB
				.prepare(
					`INSERT INTO categories
					(id, name, description, parent_id, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					categoryId,
					categoryName,
					`Category automatically created from product '${product.name}'.`,
					null,
					now,
					now
				);
		}

		// ── Product insert statement ──
		const productInsertStmt = c.env.DB
			.prepare(
				`INSERT INTO products
				(
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
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				productId,
				product.name,
				product.description,
				product.category,
				product.product_group,
				product.image,
				product.cost_price,
				product.compare_price,
				product.price,
				product.profit_percent,
				product.discount_percent,
				product.region,
				product.delivery_type,
				product.stock,
				product.active,
				now
			);

		// ── Inventory insert statement ──
		const inventoryId = crypto.randomUUID();

		const inventoryInsertStmt = c.env.DB
			.prepare(
				`INSERT INTO inventory
				(id, product_id, quantity, min_quantity, warehouse, updated_at)
				VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(
				inventoryId,
				productId,
				product.stock,
				0,
				null,
				now
			);

		// ── Build batch statements ──
		const statements: any[] = [];

		if (categoryInsertStmt) {
			statements.push(categoryInsertStmt);
		}

		statements.push(productInsertStmt);
		statements.push(inventoryInsertStmt);

		// ── Execute all statements in a single transaction ──
		try {
			await c.env.DB.batch(statements);

			return c.json({
				success: true,
				message: "Product created successfully",
				product: {
					...product,
					id: productId,
					created_at: now,
				},
			});
		} catch (error) {
			console.error("Product creation failed:", error);

			return c.json(
				{
					success: false,
					message: "Failed to create product",
				},
				500
			);
		}
	}
}