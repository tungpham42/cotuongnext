import { NextResponse } from "next/server";

// The server's clock in ms. Clients use it to correct for a wrong device clock
// so move timers match what the server will enforce.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { now: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
