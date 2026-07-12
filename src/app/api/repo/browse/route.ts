import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".cache",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  ".next",
  ".turbo",
]);

// GET /api/repo/browse?path=/home/user — list subdirectories of a path
export async function GET(req: NextRequest) {
  try {
    const target = req.nextUrl.searchParams.get("path") ?? os.homedir();
    const resolved = path.resolve(target);

    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(resolved, { withFileTypes: true });
    } catch {
      return NextResponse.json(
        { error: `Cannot read directory: "${resolved}"` },
        { status: 404 }
      );
    }

    const dirs = entries
      .filter(
        (e) => e.isDirectory() && !IGNORE_DIRS.has(e.name) && !e.name.startsWith(".")
      )
      .map((e) => ({
        name: e.name,
        path: path.join(resolved, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Check if any dir looks like a project (has package.json, etc.)
    const withFlag = await Promise.all(
      dirs.slice(0, 100).map(async (d) => {
        let isProject = false;
        try {
          await fs.access(path.join(d.path, "package.json"));
          isProject = true;
        } catch {
          try {
            await fs.access(path.join(d.path, "requirements.txt"));
            isProject = true;
          } catch {
            try {
              await fs.access(path.join(d.path, "Cargo.toml"));
              isProject = true;
            } catch {
              try {
                await fs.access(path.join(d.path, "go.mod"));
                isProject = true;
              } catch {
                // not a project
              }
            }
          }
        }
        return { ...d, isProject };
      })
    );

    return NextResponse.json({
      path: resolved,
      parent: path.dirname(resolved) !== resolved ? path.dirname(resolved) : null,
      dirs: withFlag,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Browse error" },
      { status: 500 }
    );
  }
}
