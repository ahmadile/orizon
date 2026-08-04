// =========================================================================
// Orizon — Search code tool
// =========================================================================

import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types";

const execAsync = promisify(exec);

const IGNORE_DIRS = [
  "node_modules", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".venv", "venv", "target", "coverage",
];

export const searchCodeTool: Tool = {
  name: "search_code",
  description: "Search for a pattern in the codebase. Uses ripgrep (rg) if available, otherwise falls back to grep. Returns matching file paths and line numbers.",
  parameters: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Search pattern (regex or plain text)",
      },
      path: {
        type: "string",
        description: "Directory to search in (absolute path)",
      },
      filePattern: {
        type: "string",
        description: "Optional: file glob pattern (e.g. '*.ts', '*.py', '*.md')",
      },
      maxResults: {
        type: "number",
        description: "Maximum results to return (default: 30)",
      },
    },
    required: ["pattern", "path"],
  },
  execute: async (args) => {
    const pattern = args.pattern as string;
    const searchPath = path.resolve(args.path as string);
    const filePattern = args.filePattern as string | undefined;
    const maxResults = Math.min((args.maxResults as number) ?? 30, 100);

    try {
      // Try ripgrep first (faster, respects .gitignore)
      const rgArgs = [
        `--max-count ${maxResults}`,
        ...IGNORE_DIRS.map((d) => `--glob '!${d}/**'`),
        filePattern ? `--glob '${filePattern}'` : "",
        `--line-number`,
        `--smart-case`,
        `--max-filesize 500K`,
        `'-e'`,
        pattern,
        `'${searchPath}'`,
      ].filter(Boolean).join(" ");

      try {
        const { stdout } = await execAsync(`rg ${rgArgs}`, {
          timeout: 10_000,
          maxBuffer: 1024 * 1024,
        });

        const lines = stdout.split("\n").filter(Boolean).slice(0, maxResults);
        if (lines.length === 0) {
          return { success: true, output: `Aucun résultat pour "${pattern}" dans ${searchPath}` };
        }

        return {
          success: true,
          output: `🔍 Résultats pour "${pattern}" dans ${searchPath} :\n\n${lines.join("\n")}`,
          data: { matches: lines.length, pattern },
        };
      } catch {
        // rg not available or failed, use grep
        const grepArgs = [
          `-rn`,
          `--include=${filePattern ?? "*"}`,
          `--max-count=${maxResults}`,
          `'-e'`,
          pattern,
          searchPath,
        ].join(" ");

        const { stdout } = await execAsync(`grep ${grepArgs}`, {
          timeout: 15_000,
          maxBuffer: 1024 * 1024,
        });

        const lines = stdout.split("\n").filter(Boolean).slice(0, maxResults);
        if (lines.length === 0) {
          return { success: true, output: `Aucun résultat pour "${pattern}" dans ${searchPath}` };
        }

        return {
          success: true,
          output: `🔍 Résultats pour "${pattern}" dans ${searchPath} :\n\n${lines.join("\n")}`,
          data: { matches: lines.length, pattern },
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, output: `Erreur de recherche : ${msg}` };
    }
  },
};