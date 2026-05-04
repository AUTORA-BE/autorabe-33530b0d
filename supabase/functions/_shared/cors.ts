/**
 * Shared CORS helper for Edge Functions.
 *
 * - Reads ALLOWED_ORIGINS from env (comma-separated list).
 * - Falls back to a hardcoded prod+dev allowlist if the env var is missing.
 * - Echoes the request Origin only when it matches the allowlist
 *   (prevents `*` for credentialed requests and stops cross-site abuse).
 *
 * Usage:
 *   import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
 *   const cors = buildCorsHeaders(req);
 *   if (req.method === "OPTIONS") return handlePreflight(req);
 *   return new Response(body, { headers: { ...cors, "Content-Type": "application/json" } });
 */

const DEFAULT_ALLOWED = [
  "https://autora.be",
  "https://www.autora.be",
  "https://autorabe.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw) return DEFAULT_ALLOWED;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build CORS headers tied to the incoming request's Origin.
 * Returns no Allow-Origin header for unknown origins → browser rejects the response.
 */
export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = getAllowedOrigins();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin",
  };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

/** Standard OPTIONS preflight responder. */
export function handlePreflight(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(req),
  });
}

/** Helper to JSON-respond with proper CORS + content-type. */
export function jsonResponse(
  req: Request,
  body: unknown,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...buildCorsHeaders(req),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}
