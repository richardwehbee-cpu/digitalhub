import { fromHono } from "chanfana";
import { Hono } from "hono";
import { ProductList } from "./endpoints/productList";

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {
	docs_url: "/",
});

openapi.get("/api/health", (c) => {
	return c.json({
		success: true,
		service: "DigitalHub Core",
		status: "running",
	});
});

openapi.get("/api/products", ProductList);

export default app;