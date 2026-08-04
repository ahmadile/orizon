// =========================================================================
// Orizon — Agent runtime types
// =========================================================================

export interface ProviderSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: unknown;
}

export interface AgentCallbacks {
  /** New reasoning/thinking chunk */
  onReasoning?: (chunk: string) => void;
  /** New content chunk */
  onContent?: (chunk: string) => void;
  /** A tool call started (for UI feedback) */
  onToolCall?: (toolName: string, args: string) => void;
  /** A tool call finished */
  onToolResult?: (toolName: string, result: string) => void;
  /** Agent loop finished */
  onDone?: () => void;
  onError?: (message: string) => void;
}

export interface AgentOptions {
  /** Max number of reasoning+tool iterations before giving up */
  maxIterations?: number;
  /** Abort signal */
  signal?: AbortSignal;
}

export const DEFAULT_MAX_ITERATIONS = 8;