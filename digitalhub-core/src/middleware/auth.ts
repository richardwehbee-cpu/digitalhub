// src/middleware/auth.ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../types";
import { verifyJWT, type JWTPayload } from "../lib/crypto";

export type AuthVariables = {
  user: JWTPayload;
};

export const authMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthVariables;
}> = async (c, next) => {

  // ===== TEMP DEBUG =====
  console.log("==================================");
  console.log("PATH:", c.req.path);
  console.log("URL :", c.req.url);
  console.log("AUTH HEADER:", c.req.header("Authorization"));
  console.log("==================================");
  // ======================

  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      { success: false, message: "Missing or invalid Authorization header" },
      401
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return c.json(
      { success: false, message: "Missing or invalid Authorization header" },
      401
    );
  }

  const secret = c.env.JWT_SECRET;

  if (!secret) {
    return c.json(
      {
        success: false,
        message: "Server misconfiguration: JWT_SECRET not set",
      },
      500
    );
  }

  const payload = await verifyJWT(token, secret);

  if (!payload) {
    return c.json(
      { success: false, message: "Invalid or expired token" },
      401
    );
  }

  c.set("user", payload);

  await next();
};