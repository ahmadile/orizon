import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/conversations — list conversations for the current user
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    // If not logged in, return empty list (anonymous sessions are not persisted)
    if (!userId) {
      return NextResponse.json({ conversations: [] });
    }

    const conversations = await db.conversation.findMany({
      where: { userId },
      orderBy: { lastActivity: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: { content: true, role: true, timestamp: true },
        },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        phase: c.phase,
        intent: c.intent,
        lastActivity: c.lastActivity.toISOString(),
        createdAt: c.createdAt.toISOString(),
        messageCount: c._count.messages,
        lastMessage: c.messages[0]?.content?.slice(0, 100) ?? null,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DB error" },
      { status: 500 }
    );
  }
}

// POST /api/conversations — create a new conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, repoPath, repoName, phase, intent } = body;

    const userId = await getCurrentUserId();

    // Find or create the repo
    let repoId: string | null = null;
    if (repoPath && repoName) {
      const existing = await db.repo.findFirst({ where: { path: repoPath } });
      if (existing) {
        repoId = existing.id;
      } else {
        const repo = await db.repo.create({
          data: { name: repoName, path: repoPath },
        });
        repoId = repo.id;
      }
    }

    const conversation = await db.conversation.create({
      data: {
        title: title ?? "Nouvelle session",
        phase: phase ?? "comprehension",
        intent: intent ?? null,
        repoId,
        userId,
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
