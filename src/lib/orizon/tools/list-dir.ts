// =========================================================================
// Orizon — List directory tool
// =========================================================================

import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types";

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".venv", "venv", "target", "coverage",
  ".idea", ".vscode", ".turbo", ".vercel",
]);

export const listDirTool: Tool = {
  name: "list_directory",
  description: "List the contents of a directory. Shows files and subdirectories with sizes and last modified dates.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute path to the directory to list",
      },
      depth: {
        type: "number",
        description: "Optional: depth of recursion (default: 1, max: 3)",
      },
      showHidden: {
        type: "boolean",
        description: "Optional: show hidden files/directories (default: false)",
      },
    },
    required: ["path"],
  },
  execute: async (args) => {
    const dirPath = path.resolve(args.path as string);
    const depth = Math.min((args.depth as number) ?? 1, 3);
    const showHidden = (args.showHidden as boolean) ?? false;

    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        return { success: false, output: `Erreur : "${dirPath}" n'est pas un dossier.` };
      }

      const result = await buildTree(dirPath, 0, depth, showHidden);
      return {
        success: true,
        output: `📁 ${dirPath}\n\n${result}`,
        data: { path: dirPath },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, output: `Erreur de lecture : ${msg}` };
    }
  },
};

async function buildTree(dir: string, currentDepth: number, maxDepth: number, showHidden: boolean): Promise<string> {
  if (currentDepth >= maxDepth) return "";

  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return "";
  }

  // Filter and sort: directories first, then alphabetically
  const filtered = entries
    .filter((e) => {
      if (!showHidden && e.name.startsWith(".")) return false;
      if (e.isDirectory() && IGNORE_DIRS.has(e.name)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  const lines: string[] = [];
  const prefix = "  ".repeat(currentDepth);

  for (const entry of filtered) {
    const fullPath = path.join(dir, entry.name);
    try {
      const s = await fs.stat(fullPath);
      if (entry.isDirectory()) {
        const subTree = await buildTree(fullPath, currentDepth + 1, maxDepth, showHidden);
        const subCount = subTree ? ` (${subTree.split("\n").length} entrées)` : "";
        lines.push(`${prefix}📁 ${entry.name}/${subCount}`);
        if (subTree) lines.push(subTree);
      } else {
        const size = formatSize(s.size);
        lines.push(`${prefix}📄 ${entry.name}  (${size})`);
      }
    } catch {
      lines.push(`${prefix}❓ ${entry.name}`);
    }
  }

  return lines.join("\n");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}