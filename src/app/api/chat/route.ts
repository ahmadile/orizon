import { NextRequest } from "next/server";
import { streamChat, type ChatMessage } from "@/lib/aionlabs/client";
import { buildSystemPrompt } from "@/lib/aionlabs/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  messages: ChatMessage[];
  context?: string;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, context } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Prepend the system prompt
  const fullMessages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(context) },
    ...messages,
  ];

  // Set up SSE streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        await streamChat(fullMessages, {
          onReasoning: (chunk) => send("reasoning", { chunk }),
          onContent: (chunk) => send("content", { chunk }),
          onDone: () => send("done", {}),
          onError: (err) => send("error", { message: err.message }),
        });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
