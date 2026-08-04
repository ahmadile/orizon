// =========================================================================
// Orizon — Write file tool
// =========================================================================

import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types";

export const writeFileTool: Tool = {
  name: "write_file",
  description: "Create or overwrite a file with the given content. Creates parent directories if they don't exist.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute path to the file to write",
      },
      content: {
        type: "string",
        description: "Content to write to the file",
      },
    },
    required: ["path", "content"],
  },
  execute: async (args) => {
    const filePath = path.resolve(args.path as string);
    const content = args.content as string;

    try {
      // Create parent directories if needed
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      return {
        success: true,
        output: `✅ Fichier créé : ${filePath}\n${content.split("\n").length} lignes écrites.`,
        data: { path: filePath, lines: content.split("\n").length },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, output: `Erreur d'écriture : ${msg}` };
    }
  },
};