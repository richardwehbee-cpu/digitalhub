import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyJWT, hashPassword } from "../lib/crypto";

export class UserCreate extends OpenAPIRoute {
	schema = {
		tags: ["Admin"],
		summary: "Create a new user (Admin only)",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							fullName: z.string().optional(),
							email: z.string().email(),
							username: z.string().min(3).optional(),
							password: z.string().min(8),
							phone: z.string().optional(),
							position: z.string().optional(),
							role: z
								.enum(["Admin", "Manager", "Viewer"])
								.default("Viewer"),
						}),
					},
				},
			},
		},
		responses: {
			"201": { description: "User created" },
			"401": { description: "Unauthorized" },
			"403": { description: "Forbidden" },
			"409": {
				description: "Email or username already exists",
			},
		},
	};

	async handle(c: AppContext) {
		const secret = c.env.JWT_SECRET;

		if (!secret) {
			return c.json(
				{
					success: false,
					message: "Server misconfiguration",
				},
				500
			);
		}

		const authHeader = c.req.header("Authorization") ?? "";
		const token = authHeader.replace("Bearer ", "").trim();

		if (!token) {
			return c.json(
				{
					success: false,
					message: "Unauthorized",
				},
				401
			);
		}

		const payload = await verifyJWT(token, secret);

		if (!payload) {
			return c.json(
				{
					success: false,
					message: "Invalid or expired token",
				},
				401
			);
		}

		// Check if the current user is Admin
		const currentUser = await c.env.DB
			.prepare("SELECT role FROM users WHERE id = ?")
			.bind(payload.sub)
			.first<{ role: string }>();

		if (!currentUser || currentUser.role !== "Admin") {
			return c.json(
				{
					success: false,
					message: "Forbidden: Admin only",
				},
				403
			);
		}

		const data = await this.getValidatedData<typeof this.schema>();

		const {
			fullName,
			email,
			username,
			password,
			phone,
			position,
			role,
		} = data.body;

		// Check if email already exists
		const existingEmail = await c.env.DB
			.prepare("SELECT id FROM users WHERE email = ?")
			.bind(email)
			.first();

		if (existingEmail) {
			return c.json(
				{
					success: false,
					message: "Email already exists",
				},
				409
			);
		}

		// Check if username is provided and already exists
		let finalUsername = username;

		if (username) {
			const existingUsername = await c.env.DB
				.prepare("SELECT id FROM users WHERE username = ?")
				.bind(username)
				.first();

			if (existingUsername) {
				return c.json(
					{
						success: false,
						message: "Username already taken",
					},
					409
				);
			}
		} else {
			// Generate a username from email
			finalUsername = email.split("@")[0];

			// Ensure it's unique
			const baseUsername = finalUsername;
			let counter = 1;

			while (true) {
				const existing = await c.env.DB
					.prepare(
						"SELECT id FROM users WHERE username = ?"
					)
					.bind(finalUsername)
					.first();

				if (!existing) break;

				finalUsername = `${baseUsername}${counter}`;
				counter++;
			}
		}

		const id = crypto.randomUUID();
		const passwordHash = await hashPassword(password);

		await c.env.DB
			.prepare(
				`INSERT INTO users
					(id, email, password_hash, role, full_name, phone, position, username, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
			)
			.bind(
				id,
				email,
				passwordHash,
				role,
				fullName ?? null,
				phone ?? null,
				position ?? null,
				finalUsername
			)
			.run();

		return c.json(
			{
				success: true,
				message: "User created successfully",
				user: {
					id,
					email,
					role,
					fullName: fullName ?? "",
					phone: phone ?? "",
					position: position ?? "",
					username: finalUsername,
				},
			},
			201
		);
	}
}