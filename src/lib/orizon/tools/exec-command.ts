// =========================================================================
// Orizon — Execute command tool
// =========================================================================

import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Tool } from "./types";

const execAsync = promisify(exec);

const MAX_OUTPUT = 10_000; // chars
const DEFAULT_TIMEOUT = 30_000; // 30s
const IS_WIN = process.platform === "win32";

// Commandes disponibles sur chaque plateforme
const UNIX_COMMANDS = [
  "ls", "cat", "head", "tail", "wc", "find", "grep", "mkdir", "cp", "mv",
  "rm", "echo", "pwd", "which", "file", "du", "diff", "sort", "uniq", "tree",
  "chmod", "chown", "touch", "ps", "kill",
];

const WIN_COMMANDS = [
  "dir", "type", "findstr", "where", "echo", "mkdir", "copy", "move",
  "del", "rmdir", "fc", "sort", "tree", "more", "powershell", "Get-ChildItem",
  "Get-Content", "Select-String", "Get-Command", "Measure-Object",
  // Unix compatibles via PowerShell
  "ls", "cat", "pwd", "cp", "mv", "rm", "diff", "grep", "wc", "sort",
  "uniq", "head", "tail", "which",
];

const ALLOWED_COMMANDS = IS_WIN 
  ? [...new Set([...WIN_COMMANDS, ...UNIX_COMMANDS.filter(c => !WIN_COMMANDS.includes(c))])]
  : UNIX_COMMANDS;

export const execCommandTool: Tool = {
  name: "exec_command",
  description: `Execute a shell command in the project directory. ${
    IS_WIN 
      ? "Système: Windows (PowerShell). Utilisez des commandes PowerShell ou CMD."
      : "Système: Unix/Linux. Utilisez des commandes shell standard."
  } Commandes autorisées: ${ALLOWED_COMMANDS.join(", ")}. Retourne stdout + stderr (max 10KB).`,
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: IS_WIN
          ? "Commande PowerShell à exécuter (ex: 'Get-ChildItem', 'cat fichier.txt', 'git status')"
          : "Commande shell à exécuter (ex: 'ls -la', 'git status', 'npm test')",
      },
      cwd: {
        type: "string",
        description: "Working directory (chemin absolu). Par défaut: le dossier du projet.",
      },
      timeout: {
        type: "number",
        description: "Timeout en ms (défaut: 30000, max: 120000)",
      },
    },
    required: ["command"],
  },
  execute: async (args) => {
    const command = args.command as string;
    const cwd = args.cwd as string | undefined;
    const timeout = Math.min((args.timeout as number) ?? DEFAULT_TIMEOUT, 120_000);

    // Vérification que la commande est autorisée
    const cmdName = command.trim().split(/\s+/)[0];
    // Sur Windows, les commandes PowerShell sont case-insensitive
    const cmdLower = cmdName.toLowerCase();
    const isAllowed = ALLOWED_COMMANDS.some(c => c.toLowerCase() === cmdLower);
    
    if (!isAllowed) {
      return {
        success: false,
        output: `Commande non autorisée : "${cmdName}". Commandes autorisées : ${ALLOWED_COMMANDS.join(", ")}`,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        IS_WIN ? `powershell.exe -NoProfile -NonInteractive -Command "${command.replace(/"/g, '\\"')}"` : command,
        {
          cwd,
          timeout,
          maxBuffer: 10 * 1024 * 1024,
          shell: IS_WIN ? "powershell.exe" : undefined,
        }
      );

      let output = "";
      if (stdout) output += stdout.slice(0, MAX_OUTPUT);
      if (stderr) {
        // Ignorer le message de bienvenue PowerShell
        const cleanStderr = stderr.replace(/Windows PowerShell\nCopyright.*\n/g, "").trim();
        if (cleanStderr) {
          if (output) output += "\n";
          output += cleanStderr.slice(0, MAX_OUTPUT / 2);
        }
      }

      if (!output) output = "✅ Commande exécutée (aucune sortie).";

      return {
        success: true,
        output: `$ ${command}\n\n${output}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Nettoyer les erreurs PowerShell verbeuses
      const cleanMsg = msg
        .replace(/[\s\S]*\n\+ CategoryInfo[\s\S]*/, "")
        .replace(/\+ FullyQualifiedErrorId[\s\S]*/, "")
        .trim();
      return {
        success: false,
        output: `$ ${command}\n\nErreur : ${cleanMsg.slice(0, MAX_OUTPUT)}`,
      };
    }
  },
};