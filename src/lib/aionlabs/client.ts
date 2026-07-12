import "server-only";

// =========================================================================
// Aion Labs client — OpenAI-compatible REST API
// https://www.aionlabs.ai/docs
// =========================================================================

const API_KEY = process.env.AIONLABS_API_KEY;
const BASE_URL = process.env.AIONLABS_BASE_URL ?? "https://api.aionlabs.ai/v1";
const DEFAULT_MODEL = process.env.AIONLABS_MODEL ?? "aion-labs/aion-3.0";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatStreamCallbacks {
  onReasoning?: (chunk: string) => void;
  onContent?: (chunk: string) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
}

function assertKey() {
  if (!API_KEY) {
    throw new Error(
      "AIONLABS_API_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
}

/**
 * Stream a chat completion from Aion Labs.
 * The model emits two kinds of deltas:
 *   - `delta.reasoning`  — chain-of-thought (optional, shown as a subtle aside)
 *   - `delta.content`    — the actual answer
 */
export async function streamChat(
  messages: ChatMessage[],
  cb: ChatStreamCallbacks,
  opts?: { model?: string; maxTokens?: number; signal?: AbortSignal }
): Promise<void> {
  assertKey();

  const model = opts?.model ?? DEFAULT_MODEL;
  const maxTokens = opts?.maxTokens ?? 2048;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: opts?.signal,
    });
  } catch (err) {
    cb.onError?.(err as Error);
    return;
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    cb.onError?.(
      new Error(`Aion Labs API error ${res.status}: ${text.slice(0, 200)}`)
    );
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
        const line = evt.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;

        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          cb.onDone?.();
          return;
        }

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta;
          if (!delta) continue;

          if (typeof delta.reasoning === "string" && delta.reasoning) {
            cb.onReasoning?.(delta.reasoning);
          }
          if (typeof delta.content === "string" && delta.content) {
            cb.onContent?.(delta.content);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
    cb.onDone?.();
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      cb.onDone?.();
      return;
    }
    cb.onError?.(err as Error);
  }
}

/**
 * Non-streaming completion — used for short, structured calls
 * (e.g. generating a title, classifying intent).
 */
export async function complete(
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number }
): Promise<string> {
  assertKey();

  const model = opts?.model ?? DEFAULT_MODEL;
  const maxTokens = opts?.maxTokens ?? 512;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Aion Labs API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

export const CURRENT_MODEL = DEFAULT_MODEL;
