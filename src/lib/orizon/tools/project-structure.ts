// =========================================================================
// Orizon — Project structure tool
// =========================================================================

import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types";

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".venv", "venv", "target", "coverage",
  ".idea", ".vscode", ".turbo", ".vercel",
]);

const MAX_FILES = 200;

export const projectStructureTool: Tool = {
  name: "project_structure",
  description: "Get the full project structure: directory tree, file counts by type, key files (package.json, README, config files). Use this first when analyzing a new project.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute path to the project root",
      },
      includeContent: {
        type: "boolean",
        description: "Optional: include content of key files (README, package.json) (default: true)",
      },
    },
    required: ["path"],
  },
  execute: async (args) => {
    const projectPath = path.resolve(args.path as string);
    const includeContent = (args.includeContent as boolean) ?? true;

    try {
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) {
        return { success: false, output: `Erreur : "${projectPath}" n'est pas un dossier.` };
      }

      // Collect all files
      const files: { path: string; ext: string; size: number }[] = [];
      await walkDir(projectPath, projectPath, 0, files);

      // Count by extension
      const extCounts: Record<string, number> = {};
      for (const f of files) {
        const ext = f.ext || "(no ext)";
        extCounts[ext] = (extCounts[ext] ?? 0) + 1;
      }

      // Sort extensions by count
      const sortedExts = Object.entries(extCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      // Detect key files
      const keyFiles = [
        "package.json", "README.md", "readme.md", "Readme.md",
        "tsconfig.json", "next.config.ts", "next.config.js",
        "Cargo.toml", "go.mod", "requirements.txt", "pyproject.toml",
        ".env.example", "Dockerfile", "docker-compose.yml",
        "Makefile", "justfile",
      ];

      const foundKeyFiles: { name: string; content?: string }[] = [];
      for (const kf of keyFiles) {
        try {
          const kfPath = path.join(projectPath, kf);
          await fs.access(kfPath);
          const content = includeContent
            ? await fs.readFile(kfPath, "utf-8").then(c => c.slice(0, 2000)).catch(() => "")
            : "";
          foundKeyFiles.push({ name: kf, content: content || undefined });
        } catch {
          // not found
        }
      }

      // Build output
      let output = `📁 ${projectPath}\n\n`;
      output += `📊 **Statistiques**\n`;
      output += `- Total fichiers : ${files.length}\n`;
      output += `- Types : ${sortedExts.map(([ext, count]) => `${ext} (${count})`).join(", ")}\n\n`;

      if (foundKeyFiles.length > 0) {
        output += `📄 **Fichiers clés**\n`;
        for (const kf of foundKeyFiles) {
          output += `- \`${kf.name}\``;
          if (kf.content) {
            const lines = kf.content.split("\n").length;
            output += ` (${lines} lignes)`;
          }
          output += "\n";
        }
        output += "\n";

        for (const kf of foundKeyFiles) {
          if (kf.content) {
            output += `### ${kf.name}\n\`\`\`\n${kf.content.slice(0, 1500)}\n\`\`\`\n\n`;
          }
        }
      }

      // Build tree (limited depth)
      output += `📂 **Arborescence**\n`;
      output += await buildCompactTree(projectPath, projectPath, 0, 2);

      return {
        success: true,
        output,
        data: { totalFiles: files.length, extensions: sortedExts, keyFiles: foundKeyFiles.map(f => f.name) },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, output: `Erreur : ${msg}` };
    }
  },
};

async function walkDir(dir: string, root: string, depth: number, files: { path: string; ext: string; size: number }[]): Promise<void> {
  if (files.length >= MAX_FILES || depth > 10) return;

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDir(fullPath, root, depth + 1, files);
    } else if (entry.isFile()) {
      try {
        const stat = await fs.stat(fullPath);
        files.push({ path: fullPath, ext: path.extname(entry.name).toLowerCase(), size: stat.size });
      } catch {
        // skip
      }
    }
  }
}

async function buildCompactTree(dir: string, root: string, depth: number, maxDepth: number): Promise<string> {
  if (depth >= maxDepth) return "  ... (profondeur maximale atteinte)\n";

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return "";
  }

  const filtered = entries
    .filter((e) => !e.name.startsWith(".") && !IGNORE_DIRS.has(e.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 30);

  let result = "";
  for (const entry of filtered) {
    const prefix = "  ".repeat(depth);
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result += `${prefix}📁 ${entry.name}/\n`;
      if (depth + 1 < maxDepth) {
        const sub = await buildCompactTree(fullPath, root, depth + 1, maxDepth);
        result += sub;
      }
    } else {
      result += `${prefix}📄 ${entry.name}\n`;
    }
  }

  return result;
}