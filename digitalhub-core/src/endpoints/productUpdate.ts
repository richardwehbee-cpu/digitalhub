import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class ProductUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Products"],
		summary: "Update Product",
		request: {
			params: z.object({
				id: z.string(),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: z.string().optional(),
							description: z.string().optional(),
							category: z.string().optional(),
							image: z.string().optional(),
							cost_price: z.number().optional(),
							compare_price: z.number().optional(),
							price: z.number().optional(),
							profit_percent: z.number().optional(),
							discount_percent: z.number().optional(),
							region: z.string().optional(),
							delivery_type: z.string().optional(),
							stock: z.number().optional(),
							active: z.number().optional(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Product updated",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const id = data.params.id;
		const product = data.body;

		const result = await c.env.DB.prepare(
			`UPDATE products SET
				name = COALESCE(?, name),
				description = COALESCE(?, description),
				category = COALESCE(?, category),
				image = COALESCE(?, image),
				cost_price = COALESCE(?, cost_price),
				compare_price = COALESCE(?, compare_price),
				price = COALESCE(?, price),
				profit_percent = COALESCE(?, profit_percent),
				discount_percent = COALESCE(?, discount_percent),
				region = COALESCE(?, region),
				delivery_type = COALESCE(?, delivery_type),
				stock = COALESCE(?, stock),
				active = COALESCE(?, active)
			WHERE id = ?`
		)
			.bind(
				product.name ?? null,
				product.description ?? null,
				product.category ?? null,
				product.image ?? null,
				product.cost_price ?? null,
				product.compare_price ?? null,
				product.price ?? null,
				product.profit_percent ?? null,
				product.discount_percent ?? null,
				product.region ?? null,
				product.delivery_type ?? null,
				product.stock ?? null,
				product.active ?? null,
				id
			)
			.run();

		return {
			success: true,
			message: "Product updated successfully",
			result,
		};
	}
}