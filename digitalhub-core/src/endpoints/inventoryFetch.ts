import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class InventoryFetch extends OpenAPIRoute {
	schema = {
		tags: ["Inventory"],
		summary: "Get Inventory By ID",
		request: {
			params: z.object({
				id: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "Inventory found",
			},
			"404": {
				description: "Inventory not found",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const inventory = await c.env.DB
			.prepare(`SELECT * FROM inventory WHERE id = ?`)
			.bind(data.params.id)
			.first();

		if (!inventory) {
			return {
				success: false,
				message: "Inventory not found",
			};
		}

		return {
			success: true,
			inventory,
		};
	}
}