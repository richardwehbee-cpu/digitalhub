/**
 * Generates a UUID v4 string.
 * Uses the Web Crypto API which is available in all modern browsers
 * and in Cloudflare Workers.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}