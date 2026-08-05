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

// Lazy import for project-structure to avoid Turbopack tracing issues
let _projectStructureTool: Tool | undefined;

export async function getProjectStructureTool(): Promise<Tool> {
  if (!_projectStructureTool) {
    const mod = await import("./project-structure");
    _projectStructureTool = mod.projectStructureTool;
  }
  return _projectStructureTool;
}

export * from "./types";
export { readFileTool } from "./read-file";
export { writeFileTool } from "./write-file";
export { execCommandTool } from "./exec-command";
export { searchCodeTool } from "./search-code";
export { listDirTool } from "./list-dir";
export { gitOpsTool } from "./git-ops";

/**
 * All available tools, in order of importance.
 */
export const TOOLS: Tool[] = [
  readFileTool,
  listDirTool,
  searchCodeTool,
  writeFileTool,
  execCommandTool,
  gitOpsTool,
];

export async function getAllTools(): Promise<Tool[]> {
  const projectTool = await getProjectStructureTool();
  return [projectTool, ...TOOLS];
}

export async function getTool(name: string): Promise<Tool | undefined> {
  if (name === "project_structure") {
    return await getProjectStructureTool();
  }
  return TOOLS.find((t) => t.name === name);
}