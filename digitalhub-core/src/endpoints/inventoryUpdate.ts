import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class InventoryUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Inventory"],
		summary: "Update Inventory",
		request: {
			params: z.object({
				id: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
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
				description: "Inventory updated successfully",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const { id } = data.params;
		const {
			product_id,
			quantity,
			min_quantity,
			warehouse,
		} = data.body;

		const result = await c.env.DB
			.prepare(`
				UPDATE inventory
				SET
					product_id = ?,
					quantity = ?,
					min_quantity = ?,
					warehouse = ?
				WHERE id = ?
			`)
			.bind(
				product_id,
				quantity,
				min_quantity ?? 0,
				warehouse ?? null,
				id
			)
			.run();

		return {
			success: true,
			message: "Inventory updated successfully",
			result,
		};
	}
}