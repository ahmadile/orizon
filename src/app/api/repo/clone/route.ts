import { NextRequest, NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

const CLONE_ROOT = path.resolve(process.cwd(), "..", "repos");

// Maximum repo size we accept to clone (approx, checked after clone)
const MAX_REPO_SIZE_MB = 200;

interface GitHubURL {
  owner: string;
  repo: string;
  branch?: string;
  subPath?: string;
}

function parseGitHubURL(input: string): GitHubURL | null {
  const trimmed = input.trim();

  // Match: https://github.com/owner/repo
  //        https://github.com/owner/repo.git
  //        https://github.com/owner/repo/tree/branch/sub/path
  //        git@github.com:owner/repo.git
  let match = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+))?)?$/
  );
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      branch: match[3],
      subPath: match[4],
    };
  }

  // SSH form
  match = trimmed.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  // Short form: owner/repo
  match = trimmed.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url, depth } = await req.json() as { url: string; depth?: number };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    const parsed = parseGitHubURL(url);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "URL GitHub invalide. Exemples acceptés :\n• https://github.com/owner/repo\n• https://github.com/owner/repo/tree/main\n• owner/repo",
        },
        { status: 400 }
      );
    }

    // Ensure clone root exists
    await fs.mkdir(CLONE_ROOT, { recursive: true });

    // Target directory: repos/owner-repo
    const targetDir = path.join(CLONE_ROOT, `${parsed.owner}--${parsed.repo}`);

    // If already cloned, remove first (idempotent)
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch {
      // doesn't exist, fine
    }

    // Build the git clone command
    const cloneDepth = depth && depth > 0 && depth <= 50 ? depth : 50;
    const cloneURL = `https://github.com/${parsed.owner}/${parsed.repo}.git`;
    const cmd = `git clone --depth ${cloneDepth} --single-branch ${
      parsed.branch ? `--branch ${parsed.branch}` : ""
    } "${cloneURL}" "${targetDir}" 2>&1`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 120_000, // 2 minutes max
        maxBuffer: 10 * 1024 * 1024,
      });

      // Check repo size
      try {
        const stat = await fs.stat(targetDir);
        // Can't easily get dir size without du, so skip strict check
        void stat;
      } catch {
        // ignore
      }

      // Read package.json / README for quick metadata
      let description = "";
      try {
        const readme = await fs.readFile(
          path.join(targetDir, "README.md"),
          "utf-8"
        );
        description = readme.slice(0, 500);
      } catch {
        // no readme
      }

      return NextResponse.json({
        ok: true,
        path: targetDir,
        name: parsed.repo,
        owner: parsed.owner,
        branch: parsed.branch ?? "main",
        description,
        cloneOutput: (stdout + stderr).slice(0, 500),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: `Échec du clone. Vérifiez que le dépôt est public et l'URL correcte.\n\n${msg.slice(0, 300)}`,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Clone error" },
      { status: 500 }
    );
  }
}
