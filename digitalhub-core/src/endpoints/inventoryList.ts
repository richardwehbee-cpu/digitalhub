import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class InventoryList extends OpenAPIRoute {
	schema = {
		tags: ["Inventory"],
		summary: "List Inventory",
		responses: {
			"200": {
				description: "Returns inventory records",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							inventory: z.array(z.any()),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const result = await c.env.DB
			.prepare(`
				SELECT
					id,
					product_id,
					quantity,
					min_quantity,
					warehouse,
					updated_at
				FROM inventory
				ORDER BY updated_at DESC
			`)
			.all();

		return {
			success: true,
			inventory: result.results,
		};
	}
}