import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/llm/system-prompt";
import { agentLoop } from "@/lib/orizon/agent/runtime";
import type { AgentCallbacks } from "@/lib/orizon/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  context?: string;
  phase?: string;
  intent?: string | null;
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
    apiKey: map.api_key ?? process.env.LLM_API_KEY ?? process.env.AIONLABS_API_KEY ?? "",
    baseUrl: map.base_url ?? process.env.LLM_BASE_URL ?? process.env.AIONLABS_BASE_URL ?? "https://api.openai.com/v1",
    model: map.model ?? process.env.LLM_MODEL ?? process.env.AIONLABS_MODEL ?? "gpt-4o-mini",
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

  const { messages, context, phase, intent } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate phase
  const validPhases = ["comprehension", "intention", "experimentation", "maquette", "generation"];
  const currentPhase = (phase && validPhases.includes(phase) ? phase : "comprehension") as
    | "comprehension" | "intention" | "experimentation" | "maquette" | "generation";
  const currentIntent = (intent === "improve" || intent === "derive" || intent === "adapt")
    ? intent
    : null;

  // Load provider settings (DB > env)
  const settings = await loadProviderSettings();

  if (!settings.apiKey && !settings.baseUrl.includes("localhost")) {
    return new Response(
      JSON.stringify({
        error:
          "Aucune clé API configurée. Ouvrez les Paramètres (icône engrenage) pour ajouter un provider.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build the system prompt + conversation history
  // Le context peut contenir le chemin réel du projet
  const repoPath = context || undefined;
  const systemPrompt = buildSystemPrompt(currentPhase, currentIntent, context, repoPath);
  const fullMessages = [
    { role: "system" as const, content: systemPrompt } as const,
    ...messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
  ];

  // ✅ Agent runtime — handles tool calls + LLM loop
  // We produce an SSE stream so the client can show tool calls in real time
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const callbacks: AgentCallbacks = {
        onReasoning: (chunk: string) => {
          send("reasoning", { chunk });
        },
        onContent: (chunk: string) => {
          send("content", { chunk });
        },
        onToolCall: (toolName: string, args: string) => {
          send("tool_call", { name: toolName, args });
        },
        onToolResult: (toolName: string, output: string) => {
          send("tool_result", {
            name: toolName,
            output: output.slice(0, 500),
          });
        },
        onDone: () => {
          send("done", {});
          controller.close();
        },
        onError: (message: string) => {
          send("error", { message });
          controller.close();
        },
      };

      try {
        await agentLoop(fullMessages, settings, callbacks);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        // Only send error if not already done
        try {
          send("error", { message: msg });
          controller.close();
        } catch {
          // controller already closed
        }
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