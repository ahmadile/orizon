// =========================================================================
// Orizon — Read file tool
// =========================================================================

import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_OUTPUT_LINES = 500;

export const readFileTool: Tool = {
  name: "read_file",
  description: "Read the contents of a file. Returns the file content with line numbers. Max 500 lines.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute path to the file to read",
      },
      startLine: {
        type: "number",
        description: "Optional: start line (1-indexed) to read from",
      },
      endLine: {
        type: "number",
        description: "Optional: end line (1-indexed) to read to",
      },
    },
    required: ["path"],
  },
  execute: async (args) => {
    const filePath = path.resolve(args.path as string);
    const startLine = (args.startLine as number) ?? 1;
    const endLine = args.endLine as number | undefined;

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        return { success: false, output: `Erreur : "${filePath}" n'est pas un fichier.` };
      }
      if (stat.size > MAX_FILE_SIZE) {
        return { success: false, output: `Erreur : fichier trop volumineux (${(stat.size / 1024 / 1024).toFixed(1)} Mo). Maximum: 1 Mo.` };
      }

      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      const selected = endLine
        ? lines.slice(startLine - 1, endLine)
        : lines.slice(startLine - 1, startLine - 1 + MAX_OUTPUT_LINES);

      const numbered = selected.map((line, i) => `${startLine + i} | ${line}`).join("\n");

      const total = lines.length;
      const shown = selected.length;
      const truncated = total > startLine + shown - 1;

      let output = `📄 ${filePath}\n${total} lignes total · affichage lignes ${startLine}–${startLine + shown - 1}\n\n${numbered}`;
      if (truncated) {
        output += `\n\n... (${total - (startLine + shown - 1)} lignes restantes. Utilisez startLine/endLine pour lire la suite)`;
      }

      return { success: true, output };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, output: `Erreur de lecture : ${msg}` };
    }
  },
};