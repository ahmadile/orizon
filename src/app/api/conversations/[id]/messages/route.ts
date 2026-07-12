import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/conversations/[id]/messages — append a message
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { role, content, reasoning, attachments, error } = body;

    const message = await db.message.create({
      data: {
        conversationId: id,
        role,
        content,
        reasoning: reasoning ?? null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        error: error ?? false,
      },
    });

    // Bump conversation's lastActivity
    await db.conversation.update({
      where: { id },
      data: { lastActivity: new Date() },
    });

    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 }
    );
  }
}
