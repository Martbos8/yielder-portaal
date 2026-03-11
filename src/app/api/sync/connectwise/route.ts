import { NextRequest, NextResponse } from "next/server";
import { syncAll } from "@/lib/connectwise/sync";

/**
 * POST /api/sync/connectwise
 * Triggers a full ConnectWise sync. Secured with SYNC_SECRET header.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-sync-secret");
  const expectedSecret = process.env['SYNC_SECRET'];

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await syncAll();

    if (results.length === 0) {
      return NextResponse.json({
        message: "Demo modus — geen CW API keys geconfigureerd",
        results: [],
      });
    }

    return NextResponse.json({ message: "Sync voltooid", results });
  } catch {
    return NextResponse.json(
      { error: "Sync mislukt" },
      { status: 500 }
    );
  }
}
