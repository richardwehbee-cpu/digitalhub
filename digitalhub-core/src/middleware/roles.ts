// src/middleware/roles.ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../types";
import type { AuthVariables } from "./auth";

export type Role = "Admin" | "Manager" | "Viewer";

const ROLE_RANK: Record<Role, number> = {
  Viewer: 0,
  Manager: 1,
  Admin: 2,
};

export function requireRole(
  minRole: Role
): MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ success: false, message: "Authentication required" }, 401);
    }

    const userRank = ROLE_RANK[user.role as Role];
    const requiredRank = ROLE_RANK[minRole];

    if (userRank === undefined || userRank < requiredRank) {
      return c.json({ success: false, message: "Insufficient permissions" }, 403);
    }

    await next();
  };
}

// Admin only / Manager or Admin / any authenticated role
export const adminOnly = requireRole("Admin");
export const managerOrAbove = requireRole("Manager");
export const viewerOrAbove = requireRole("Viewer");