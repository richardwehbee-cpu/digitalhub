import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class InventoryCreate extends OpenAPIRoute {
	schema = {
		tags: ["Inventory"],
		summary: "Create Inventory Record",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							id: z.string(),
							product_id: z.string(),
							quantity: z.number().int(),
							min_quantity: z.number().int().optional(),
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
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const {
			id,
			product_id,
			quantity,
			min_quantity,
			warehouse,
		} = data.body;

		const result = await c.env.DB.prepare(
			`
			INSERT INTO inventory (
				id,
				product_id,
				quantity,
				min_quantity,
				warehouse
			)
			VALUES (?, ?, ?, ?, ?)
			`
		)
			.bind(
				id,
				product_id,
				quantity,
				min_quantity ?? 0,
				warehouse ?? null
			)
			.run();

		return {
			success: true,
			message: "Inventory record created successfully",
			result,
		};
	}
}