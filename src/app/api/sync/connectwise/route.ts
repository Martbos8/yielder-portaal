import { NextRequest, NextResponse } from "next/server";
import { syncAll } from "@/lib/connectwise/sync";
import { invalidateAllCaches } from "@/lib/repositories";
import { AuthError, isAppError, toErrorResponse } from "@/lib/errors";

/**
 * POST /api/sync/connectwise
 * Triggers a full ConnectWise sync. Secured with SYNC_SECRET header.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-sync-secret");
  const expectedSecret = process.env['SYNC_SECRET'];

  if (!expectedSecret || secret !== expectedSecret) {
    const err = new AuthError("Ongeldige sync credentials");
    const response = toErrorResponse(err);
    return NextResponse.json({ error: response.error }, { status: response.statusCode });
  }

  try {
    const results = await syncAll();

    if (results.length === 0) {
      return NextResponse.json({
        message: "Demo modus — geen CW API keys geconfigureerd",
        results: [],
      });
    }

    // Invalidate all caches after successful sync — data has changed
    invalidateAllCaches();

    return NextResponse.json({ message: "Sync voltooid", results });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.error, code: response.code },
      { status: isAppError(error) ? error.statusCode : 500 }
    );
  }
}
