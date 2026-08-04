// =========================================================================
// Orizon — Tool types
// =========================================================================

/**
 * A tool that the agent can call to interact with the filesystem, git, etc.
 */
export interface Tool {
  /** Unique name (snake_case, used by the LLM to call the tool) */
  name: string;
  /** Description of what the tool does (shown to the LLM) */
  description: string;
  /** JSON Schema for the parameters */
  parameters: Record<string, unknown>;
  /** Execute the tool with the given arguments */
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  /** Optional structured data for the UI */
  data?: unknown;
}

/**
 * A tool call returned by the LLM.
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * Result of executing a tool call.
 */
export interface ToolCallResult {
  role: "tool";
  tool_call_id: string;
  content: string;
}

/**
 * OpenAI-compatible tool definition format.
 */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export function toToolDefinition(tool: Tool): ToolDefinition {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}