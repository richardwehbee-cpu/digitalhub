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
		return {
			success: true,
			products: [
				{
					id: "1",
					name: "iTunes Gift Card",
					price: 10,
					stock: 100,
					active: true,
				},
				{
					id: "2",
					name: "Apple Gift Card",
					price: 25,
					stock: 50,
					active: true,
				},
			],
		};
	}
}