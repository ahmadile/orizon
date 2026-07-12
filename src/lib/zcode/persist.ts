"use client";

// =========================================================================
// Persistence client — fire-and-forget sync with the Prisma DB.
// Keeps the UI snappy while ensuring conversations survive refreshes.
// =========================================================================

export interface ConversationRow {
  id: string;
  title: string;
  phase: string;
  intent: string | null;
  lastActivity: string;
  messageCount: number;
  lastMessage: string | null;
}

export async function listConversations(): Promise<ConversationRow[]> {
  try {
    const res = await fetch("/api/conversations", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations ?? [];
  } catch {
    return [];
  }
}

export async function createConversation(opts: {
  title?: string;
  repoPath?: string;
  repoName?: string;
  phase?: string;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.conversation?.id ?? null;
  } catch {
    return null;
  }
}

export async function appendMessage(
  conversationId: string,
  msg: {
    role: string;
    content: string;
    reasoning?: string;
    attachments?: unknown[];
    error?: boolean;
  }
): Promise<void> {
  try {
    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
  } catch {
    // fire-and-forget — UI is already updated
  }
}

export async function updateConversation(
  conversationId: string,
  patch: { phase?: string; intent?: string | null; title?: string }
): Promise<void> {
  try {
    await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch {
    // fire-and-forget
  }
}
