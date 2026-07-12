import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/aionlabs/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  context?: string;
}

// Load provider settings from DB, with env fallbacks
async function loadProviderSettings() {
  const rows = await db.setting.findMany({
    where: {
      key: { in: ["provider", "api_key", "base_url", "model"] },
    },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return {
    apiKey: map.api_key ?? process.env.AIONLABS_API_KEY ?? "",
    baseUrl: map.base_url ?? process.env.AIONLABS_BASE_URL ?? "https://api.aionlabs.ai/v1",
    model: map.model ?? process.env.AIONLABS_MODEL ?? "aion-labs/aion-3.0",
  };
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

  // Load provider settings (DB > env)
  const { apiKey, baseUrl, model } = await loadProviderSettings();

  if (!apiKey && !baseUrl.includes("localhost")) {
    return new Response(
      JSON.stringify({
        error:
          "Aucune clé API configurée. Ouvrez les Paramètres (icône engrenage) pour ajouter un provider.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Prepend the system prompt
  const fullMessages = [
    { role: "system" as const, content: buildSystemPrompt(context) },
    ...messages,
  ];

  // Call the provider (OpenAI-compatible)
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        max_tokens: 4096,
        stream: true,
      }),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: `Connexion impossible à ${baseUrl}. ${
          err instanceof Error ? err.message : ""
        }`,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    return new Response(
      JSON.stringify({
        error: `Erreur API (${res.status}): ${text.slice(0, 300)}`,
      }),
      { status: res.status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream the SSE response through, normalizing event names
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const evt of events) {
            const line = evt
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!line) continue;

            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              send("done", {});
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta;
              if (!delta) continue;

              if (typeof delta.reasoning === "string" && delta.reasoning) {
                send("reasoning", { chunk: delta.reasoning });
              }
              if (typeof delta.content === "string" && delta.content) {
                send("content", { chunk: delta.content });
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
        send("done", {});
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Stream error",
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
