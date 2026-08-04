// =========================================================================
// Orizon — Git operations tool
// =========================================================================

import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { Tool } from "./types";

const execAsync = promisify(exec);

const GIT_TIMEOUT = 30_000;

export const gitOpsTool: Tool = {
  name: "git_ops",
  description: "Execute git operations: status, log, diff, branch, clone, commit, add. Use 'git clone <url>' to clone a repository.",
  parameters: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["status", "log", "diff", "branch", "clone", "add", "commit", "show"],
        description: "Git operation to perform",
      },
      path: {
        type: "string",
        description: "Path to the git repository (clone destination for 'clone' operation)",
      },
      args: {
        type: "string",
        description: "Additional arguments for the git command (e.g. '--oneline -5' for log, 'HEAD~1' for diff, 'README.md' for add, 'feat: add auth' for commit message)",
      },
      url: {
        type: "string",
        description: "Repository URL (required for 'clone' operation)",
      },
    },
    required: ["operation", "path"],
  },
  execute: async (args) => {
    const operation = args.operation as string;
    const repoPath = path.resolve(args.path as string);
    const extraArgs = (args.args as string) ?? "";
    const url = args.url as string;

    try {
      let command: string;

      switch (operation) {
        case "status":
          command = `git -C "${repoPath}" status --short`;
          break;
        case "log":
          command = `git -C "${repoPath}" log ${extraArgs || "--oneline -10"}`;
          break;
        case "diff":
          command = `git -C "${repoPath}" diff ${extraArgs || "HEAD~1"}`;
          break;
        case "branch":
          command = `git -C "${repoPath}" branch -a`;
          break;
        case "clone":
          if (!url) {
            return { success: false, output: "L'URL du dépôt est requise pour l'opération 'clone'." };
          }
          command = `git clone --depth 50 --single-branch "${url}" "${repoPath}"`;
          break;
        case "add":
          command = `git -C "${repoPath}" add ${extraArgs || "."}`;
          break;
        case "commit":
          const msg = extraArgs || "Orizon: modifications automatiques";
          command = `git -C "${repoPath}" commit -m "${msg.replace(/"/g, '\\"')}"`;
          break;
        case "show":
          command = `git -C "${repoPath}" show ${extraArgs || "HEAD"} --stat --no-patch`;
          break;
        default:
          return { success: false, output: `Opération git inconnue : "${operation}"` };
      }

      const { stdout, stderr } = await execAsync(command, {
        timeout: GIT_TIMEOUT,
        maxBuffer: 1024 * 1024,
      });

      let output = `$ ${command}\n\n`;
      if (stdout) output += stdout.slice(0, 5000);
      if (stderr) output += stderr.slice(0, 2000);

      if (!stdout && !stderr) {
        output += "✅ Opération git terminée (aucune sortie).";
      }

      return { success: true, output };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, output: `Erreur git : ${msg.slice(0, 3000)}` };
    }
  },
};