import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (c) => {
	return c.json({
		success: true,
		service: "DigitalHub Core",
		status: "running",
	});
});

export default app;