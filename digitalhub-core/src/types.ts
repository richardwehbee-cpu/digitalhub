import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const Task = z.object({
	name: z.string().openapi({ example: "lorem" }),
	slug: z.string(),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	due_date: z.iso.date(),
});
export const Product = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	price: z.number(),
	stock: z.number().default(0),
	active: z.boolean().default(true),
});