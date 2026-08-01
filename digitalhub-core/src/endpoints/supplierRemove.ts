import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";

export class SupplierRemove extends OpenAPIRoute {
	schema = {
		tags: ["Suppliers"],
		summary: "Delete Supplier",
		request: {
			params: z.object({
				id: z.string(),
			}),
		},
		responses: {
			"200": {
				description: "Supplier deleted",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const id = data.params.id;

		const result = await c.env.DB.prepare(
			"DELETE FROM suppliers WHERE id = ?"
		)
			.bind(id)
			.run();

		return {
			success: true,
			message: "Supplier deleted successfully",
			result,
		};
	}
}