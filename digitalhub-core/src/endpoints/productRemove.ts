import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class ProductRemove extends OpenAPIRoute {
	schema = {
		tags: ["Products"],
		summary: "Delete Product",
		request: {
			params: z.object({
				id: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "Product deleted",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const id = data.params.id;

		const result = await c.env.DB.prepare(
			"DELETE FROM products WHERE id = ?"
		)
			.bind(id)
			.run();

		return {
			success: true,
			message: "Product deleted successfully",
			result,
		};
	}
}