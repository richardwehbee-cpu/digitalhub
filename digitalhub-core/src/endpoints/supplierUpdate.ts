import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class SupplierUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Suppliers"],
		summary: "Update Supplier",
		request: {
			params: z.object({
				id: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: z.string(),
							email: z.string().email().optional(),
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
				description: "Supplier updated successfully",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const { id } = data.params;
		const { name, email, phone, company, country } = data.body;

		const result = await c.env.DB
			.prepare(
				`
				UPDATE suppliers
				SET
					name = ?,
					email = ?,
					phone = ?,
					company = ?,
					country = ?
				WHERE id = ?
			`
			)
			.bind(name, email ?? null, phone ?? null, company ?? null, country ?? null, id)
			.run();

		return {
			success: true,
			message: "Supplier updated successfully",
			result,
		};
	}
}