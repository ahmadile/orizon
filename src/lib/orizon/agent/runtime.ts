// =========================================================================
// Orizon — Agent Runtime
//
// Implements the ReAct pattern (Reasoning + Acting):
//   1. Call the LLM with messages + tool definitions
//   2. If the LLM responds with tool_calls, execute each tool
//   3. Append tool results to the conversation
//   4. Go back to step 1 with the updated conversation
//   5. When the LLM responds with content (no tool_calls), stream it
//
// Disclaimer: This is an agentic system that can read/write files and
// execute shell commands. Review all tool calls before trusting the agent
// with sensitive operations.
// =========================================================================

import { TOOLS, getTool, getAllTools, type Tool, type ToolCall } from "../tools";
import type { ProviderSettings, ChatMessage, AgentCallbacks, AgentOptions } from "./types";
import { DEFAULT_MAX_ITERATIONS } from "./types";

interface LLMResponse {
  content: string | null;
  tool_calls: ToolCall[] | null;
  reasoning?: string;
}

/**
 * Call the LLM with the given messages and tool definitions.
 * Returns the parsed response.
 */
async function callLLM(
  messages: ChatMessage[],
  settings: ProviderSettings,
  tools: Tool[],
  signal?: AbortSignal
): Promise<LLMResponse> {
  const toolDefinitions = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const res = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
      tool_choice: "auto",
      max_tokens: 2000,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`LLM call failed (${res.status}): ${errorText || res.statusText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message;

  if (!choice) {
    throw new Error("Réponse LLM vide ou invalide");
  }

  return {
    content: choice.content ?? null,
    tool_calls: choice.tool_calls ?? null,
    reasoning: (choice as { reasoning?: string }).reasoning,
  };
}

/**
 * Execute a single tool call and return the result message.
 */
async function executeToolCall(tc: ToolCall): Promise<ChatMessage> {
  const tool = await getTool(tc.function.name);
  if (!tool) {
    return {
      role: "tool",
      tool_call_id: tc.id,
      content: `Erreur : outil "${tc.function.name}" inconnu.`,
    };
  }

  let args: Record<string, unknown>;
  try {
    args = JSON.parse(tc.function.arguments);
  } catch {
    return {
      role: "tool",
      tool_call_id: tc.id,
      content: `Erreur : arguments JSON invalides pour "${tc.function.name}": ${tc.function.arguments}`,
    };
  }

  const result = await tool.execute(args);
  return {
    role: "tool",
    tool_call_id: tc.id,
    content: result.output,
  };
}

/**
 * Run the agent loop: LLM → tools → LLM → tools → ... → final response.
 *
 * @param messages - The conversation history (user + system messages)
 * @param settings - Provider configuration (API key, base URL, model)
 * @param cb - Callbacks for streaming content to the client
 * @param opts - Optional settings (max iterations, abort signal)
 * @returns The final assistant response content
 */
export async function agentLoop(
  messages: ChatMessage[],
  settings: ProviderSettings,
  cb: AgentCallbacks,
  opts?: AgentOptions
): Promise<string> {
  const maxIterations = opts?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const signal = opts?.signal;

  let currentMessages = [...messages];
  let iteration = 0;
  let totalContent = "";

  // Only expose tools once we have a project loaded (the first message
  // asks about the project, then tools become available)
  const availableTools = await getAllTools();

  while (iteration < maxIterations) {
    iteration++;

    // Call the LLM
    let response: LLMResponse;
    try {
      response = await callLLM(currentMessages, settings, availableTools, signal);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur LLM inconnue";
      cb.onError?.(msg);
      throw err;
    }

    // If the LLM produced reasoning, stream it
    if (response.reasoning) {
      cb.onReasoning?.(response.reasoning);
    }

    // Check if the LLM wants to call tools
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Add the assistant message with tool calls to the conversation
      currentMessages.push({
        role: "assistant",
        content: response.content, // may be null when using tools
        tool_calls: response.tool_calls,
      });

      // Notify UI about each tool call
      for (const tc of response.tool_calls) {
        cb.onToolCall?.(tc.function.name, tc.function.arguments);
      }

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        response.tool_calls.map((tc) => executeToolCall(tc))
      );

      // Add tool results to the conversation
      for (let i = 0; i < toolResults.length; i++) {
        currentMessages.push(toolResults[i]);
        cb.onToolResult?.(
          response.tool_calls[i].function.name,
          toolResults[i].content
        );
      }

      // Continue the loop — the LLM will now see the tool results
      continue;
    }

    // No tool calls — this is the final response
    const content = response.content ?? "";
    totalContent = content;

    // Stream the content chunk by chunk
    if (content) {
      // Simulate streaming by sending chunks (we already have the full response)
      // For a true streaming experience, we'd need to re-call with stream:true
      // This is a pragmatic simplification for the first version
      cb.onContent?.(content);
    }

    cb.onDone?.();
    return totalContent;
  }

  // Max iterations reached
  const msg = `⚠️ Nombre maximum d'itérations atteint (${maxIterations}). La boucle agentique s'arrête.`;
  cb.onContent?.(msg);
  cb.onDone?.();
  return msg;
}