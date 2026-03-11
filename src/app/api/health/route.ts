import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/health
 * Public health check endpoint — no auth required.
 */
export async function GET() {
  let database: "connected" | "disconnected" = "disconnected";

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      const supabase = createClient(url, key);
      const { error } = await supabase.rpc("version").maybeSingle();
      database = error ? "disconnected" : "connected";
    }
  } catch {
    database = "disconnected";
  }

  return NextResponse.json({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    database,
  });
}
