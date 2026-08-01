import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class ProductList extends OpenAPIRoute {
	schema = {
		tags: ["Products"],
		summary: "List Products",
		responses: {
			"200": {
				description: "Returns products",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							products: z.array(z.any()),
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
					active
				FROM products
			`)
			.all();

		return {
			success: true,
			products: result.results,
		};
	}
}