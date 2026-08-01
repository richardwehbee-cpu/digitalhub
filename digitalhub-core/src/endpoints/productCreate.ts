import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class ProductCreate extends OpenAPIRoute {
	schema = {
		tags: ["Products"],
		summary: "Create Product",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							id: z.string(),
							name: z.string(),
							description: z.string().optional(),

							category: z.string(),
							product_group: z.string(),
							image: z.string().optional(),

							cost_price: z.number(),
							compare_price: z.number().optional(),
							price: z.number(),

							profit_percent: z.number().default(30),
							discount_percent: z.number().default(0),

							region: z.string().optional(),
							delivery_type: z.string().optional(),

							stock: z.number(),
							active: z.number(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Product created",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const product = data.body;

		await c.env.DB.prepare(
			`INSERT INTO products
			(
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
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(
				product.id,
				product.name,
				product.description ?? "",
				product.category,
				product.product_group,
				product.image ?? "",
				product.cost_price,
				product.compare_price ?? null,
				product.price,
				product.profit_percent ?? 30,
				product.discount_percent ?? 0,
				product.region ?? "",
				product.delivery_type ?? "",
				product.stock,
				product.active
			)
			.run();

		return {
			success: true,
			message: "Product created successfully",
			product,
		};
	}
}