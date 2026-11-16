import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { handle, requireUser } from "@/lib/server";

// Create the profile on first login.
export async function POST(req: NextRequest) {
  try {
    const u = await requireUser(req);
    const ref = adminDb.doc(`users/${u.uid}`);
    if (!(await ref.get()).exists) {
      const isGuest = u.firebase?.sign_in_provider === "anonymous";
      const fallback = isGuest
        ? `Guest-${u.uid.slice(0, 4).toUpperCase()}`
        : "Guest";
      await ref.set({
        uid: u.uid,
        name: u.name || u.email?.split("@")[0] || fallback,
        photo: u.picture || null,
        elo: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        karma: 0,
        createdAt: Date.now(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handle(e);
  }
}
