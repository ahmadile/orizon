import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id] — full conversation with messages
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { timestamp: "asc" } },
        comprehensionSteps: { orderBy: { durationMs: "asc" } },
        repo: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] — update phase/intent/title
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { phase, intent, title, lastActivity } = body;

    const conversation = await db.conversation.update({
      where: { id },
      data: {
        ...(phase && { phase }),
        ...(intent !== undefined && { intent }),
        ...(title && { title }),
        lastActivity: lastActivity ? new Date(lastActivity) : new Date(),
      },
    });

    return NextResponse.json({ conversation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 }
    );
  }
}
