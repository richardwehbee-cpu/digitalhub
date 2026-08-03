import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { verifyPassword, signJWT } from "../lib/crypto";

export class AuthLogin extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Login — returns a JWT valid for 24 hours",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              email:    z.string().email(),
              password: z.string().min(1),
            }),
          },
        },
      },
    },
    responses: {
      "200": { description: "Login successful — returns JWT" },
      "401": { description: "Invalid credentials" },
      "500": { description: "Server misconfiguration" },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { email, password } = data.body;

    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json(
        { success: false, message: "Server misconfiguration: JWT_SECRET not set" },
        500
      );
    }

    // Look up the user
    const user = await c.env.DB
      .prepare(
        "SELECT id, email, password_hash, role FROM users WHERE email = ?"
      )
      .bind(email.toLowerCase().trim())
      .first<{
        id: string;
        email: string;
        password_hash: string;
        role: string;
      }>();

    if (!user) {
      // Same response as wrong password — prevents email enumeration
      return c.json(
        { success: false, message: "Invalid email or password" },
        401
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json(
        { success: false, message: "Invalid email or password" },
        401
      );
    }

    const token = await signJWT(
      { sub: user.id, email: user.email, role: user.role },
      secret,
      86_400 // 24 hours
    );

    return c.json({
      success: true,
      token,
      user: {
        id:    user.id,
        email: user.email,
        role:  user.role,
      },
    });
  }
}