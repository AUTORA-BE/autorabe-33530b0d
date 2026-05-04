import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const start = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Database connectivity check
  try {
    const t0 = Date.now();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await supabase.from("car_listings").select("id").limit(1).maybeSingle();
    checks.database = {
      ok: !error,
      latencyMs: Date.now() - t0,
      ...(error ? { error: error.message } : {}),
    };
  } catch (err) {
    checks.database = { ok: false, error: String(err) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 200 : 503;

  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json({
    status: allOk ? "ok" : "degraded",
    version: process.env.VITE_APP_VERSION ?? "unknown",
    uptime: process.uptime(),
    latencyMs: Date.now() - start,
    checks,
    ts: new Date().toISOString(),
  });
}
