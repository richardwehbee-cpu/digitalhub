import { OpenAPIRoute } from "chanfana";
import type { AppContext } from "../types";

export class OrderList extends OpenAPIRoute {
	schema = {
		tags: ["Orders"],
		summary: "List Orders",
		responses: {
			"200": {
				description: "Orders retrieved successfully",
			},
		},
	};

	async handle(c: AppContext) {
		const { results } = await c.env.DB.prepare(
			`SELECT *
			 FROM orders
			 ORDER BY created_at DESC`
		).all();

		return {
			success: true,
			orders: results,
		};
	}
}