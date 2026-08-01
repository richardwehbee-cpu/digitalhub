import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class OrderFetch extends OpenAPIRoute {
	schema = {
		tags: ["Orders"],
		summary: "Get Order By ID",
		request: {
			params: z.object({
				id: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "Order found",
			},
			"404": {
				description: "Order not found",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const order = await c.env.DB.prepare(
			`SELECT * FROM orders WHERE id = ?`
		)
			.bind(data.params.id)
			.first();

		if (!order) {
			return {
				success: false,
				message: "Order not found",
			};
		}

		return {
			success: true,
			order,
		};
	}
}