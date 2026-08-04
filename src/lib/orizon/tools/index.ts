// =========================================================================
// Orizon — Tools registry
// =========================================================================

import type { Tool } from "./types";
import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { execCommandTool } from "./exec-command";
import { searchCodeTool } from "./search-code";
import { listDirTool } from "./list-dir";
import { gitOpsTool } from "./git-ops";
import { projectStructureTool } from "./project-structure";

export * from "./types";
export { readFileTool } from "./read-file";
export { writeFileTool } from "./write-file";
export { execCommandTool } from "./exec-command";
export { searchCodeTool } from "./search-code";
export { listDirTool } from "./list-dir";
export { gitOpsTool } from "./git-ops";
export { projectStructureTool } from "./project-structure";

/**
 * All available tools, in order of importance.
 */
export const TOOLS: Tool[] = [
  projectStructureTool,
  readFileTool,
  listDirTool,
  searchCodeTool,
  writeFileTool,
  execCommandTool,
  gitOpsTool,
];

export function getTool(name: string): Tool | undefined {
  return TOOLS.find((t) => t.name === name);
}