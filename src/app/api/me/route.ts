import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/me — returns the current user or null
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
