"use client";

// =========================================================================
// SSE client for /api/chat — parses the event stream into typed callbacks.
// Now supports agentic events: tool_call, tool_result.
// =========================================================================

export interface ChatStreamCallbacks {
  onReasoning?: (chunk: string) => void;
  onContent?: (chunk: string) => void;
  onToolCall?: (name: string, args: string) => void;
  onToolResult?: (name: string, output: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

export async function streamChat(
  messages: { role: string; content: string }[],
  cb: ChatStreamCallbacks,
  signal?: AbortSignal,
  opts?: { phase?: string; intent?: string | null; context?: string }
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        phase: opts?.phase,
        intent: opts?.intent,
        context: opts?.context,
      }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      cb.onDone?.();
      return;
    }
    cb.onError?.(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    cb.onError?.(`API error ${res.status}: ${text.slice(0, 200)}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by blank lines
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const evt of events) {
        const eventLine = evt
          .split("\n")
          .find((l) => l.startsWith("event:"));
        const dataLine = evt
          .split("\n")
          .find((l) => l.startsWith("data:"));

        if (!dataLine) continue;

        const eventType = eventLine?.slice(6).trim() ?? "message";
        const data = dataLine.slice(5).trim();

        try {
          const parsed = JSON.parse(data);
          if (eventType === "reasoning" && parsed.chunk) {
            cb.onReasoning?.(parsed.chunk);
          } else if (eventType === "content" && parsed.chunk) {
            cb.onContent?.(parsed.chunk);
          } else if (eventType === "tool_call") {
            cb.onToolCall?.(parsed.name ?? "tool", parsed.args ?? "");
          } else if (eventType === "tool_result") {
            cb.onToolResult?.(parsed.name ?? "tool", parsed.output ?? "");
          } else if (eventType === "done") {
            cb.onDone?.();
            return;
          } else if (eventType === "error") {
            cb.onError?.(parsed.message ?? "Unknown error");
            return;
          }
        } catch {
          // ignore malformed JSON
        }
      }
    }
    cb.onDone?.();
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      cb.onDone?.();
      return;
    }
    cb.onError?.(err instanceof Error ? err.message : "Stream error");
  }
}