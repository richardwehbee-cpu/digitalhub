import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT } from "../lib/crypto";

export class SupplierCreate extends OpenAPIRoute {
	schema = {
		tags: ["Suppliers"],
		summary: "Create a new supplier",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: z.string().min(1, "Supplier name is required"),
							email: z.string().email("Invalid email format").optional(),
							phone: z.string().optional(),
							company: z.string().optional(),
							country: z.string().optional(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Supplier created successfully",
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
				description: "Supplier already exists",
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
		const supplier = data.body;

		// ── Trim string fields ──
		const name = supplier.name.trim();
		const email = supplier.email?.trim() ?? null;
		const phone = supplier.phone?.trim() ?? null;
		const company = supplier.company?.trim() ?? null;
		const country = supplier.country?.trim() ?? null;

		// ── Check if supplier with same name already exists ──
		const existing = await c.env.DB
			.prepare("SELECT id FROM suppliers WHERE name = ?")
			.bind(name)
			.first<{ id: string }>();

		if (existing) {
			return c.json(
				{
					success: false,
					message: "Supplier already exists",
				},
				409
			);
		}

		// ── Generate ID and timestamp ──
		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		// ── Insert supplier ──
		try {
			await c.env.DB
				.prepare(
					`INSERT INTO suppliers (
						id,
						name,
						email,
						phone,
						company,
						country,
						created_at
					)
					VALUES (?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					id,
					name,
					email,
					phone,
					company,
					country,
					now
				)
				.run();

			return c.json({
				success: true,
				message: "Supplier created successfully",
				supplier: {
					id,
					name,
					email,
					phone,
					company,
					country,
					created_at: now,
				},
			});
		} catch (error) {
			console.error("Supplier creation failed:", error);

			return c.json(
				{
					success: false,
					message: "Failed to create supplier",
				},
				500
			);
		}
	}
}