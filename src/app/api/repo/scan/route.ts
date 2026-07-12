import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================================
// Stack detection — identifies the project's languages, frameworks and runtime
// =========================================================================

interface StackInfo {
  primaryLanguage: string;
  languages: { name: string; pct: number }[];
  packageManager: string | null;
  frameworks: string[];
  totalFiles: number;
  totalLines: number;
  description: string;
}

const LANG_BY_EXT: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".py": "Python",
  ".rb": "Ruby",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".kt": "Kotlin",
  ".swift": "Swift",
  ".c": "C",
  ".cpp": "C++",
  ".h": "C",
  ".hpp": "C++",
  ".cs": "C#",
  ".php": "PHP",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "CSS",
  ".less": "CSS",
  ".json": "JSON",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".toml": "TOML",
  ".md": "Markdown",
  ".sh": "Shell",
  ".sql": "SQL",
};

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
  ".nuxt",
  ".output",
  ".turbo",
  ".vercel",
  "__pycache__",
  ".pytest_cache",
  "venv",
  ".venv",
  "env",
  "target",
  ".idea",
  ".vscode",
  ".DS_Store",
]);

const MAX_FILES = 5000;
const MAX_SIZE_KB = 512; // skip files larger than 512KB

async function walkDir(
  dir: string,
  root: string,
  depth: number,
  files: { path: string; rel: string; ext: string; size: number }[],
  ignoreSet: Set<string>
): Promise<void> {
  if (files.length >= MAX_FILES || depth > 12) return;

  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (ignoreSet.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      await walkDir(fullPath, root, depth + 1, files, ignoreSet);
    } else if (entry.isFile()) {
      try {
        const stat = await fs.stat(fullPath);
        if (stat.size > MAX_SIZE_KB * 1024) continue;
        const ext = path.extname(entry.name).toLowerCase();
        files.push({ path: fullPath, rel, ext, size: stat.size });
      } catch {
        // skip unreadable files
      }
    }
  }
}

async function parseGitignore(root: string): Promise<Set<string>> {
  const set = new Set<string>();
  try {
    const content = await fs.readFile(path.join(root, ".gitignore"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      // simple handling — just the pattern name
      const name = trimmed.replace(/^\//, "").replace(/\/$/, "").split("/")[0];
      if (name) set.add(name);
    }
  } catch {
    // no .gitignore
  }
  return set;
}

async function countLines(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

async function detectFrameworks(root: string): Promise<string[]> {
  const frameworks: string[] = [];

  // package.json
  try {
    const pkg = JSON.parse(
      await fs.readFile(path.join(root, "package.json"), "utf-8")
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["next"]) frameworks.push("Next.js");
    if (deps["react"]) frameworks.push("React");
    if (deps["vue"]) frameworks.push("Vue");
    if (deps["svelte"]) frameworks.push("Svelte");
    if (deps["nuxt"]) frameworks.push("Nuxt");
    if (deps["express"]) frameworks.push("Express");
    if (deps["fastify"]) frameworks.push("Fastify");
    if (deps["vite"]) frameworks.push("Vite");
    if (deps["tailwindcss"]) frameworks.push("Tailwind CSS");
    if (deps["prisma"]) frameworks.push("Prisma");
    if (deps["vitest"]) frameworks.push("Vitest");
    if (deps["jest"]) frameworks.push("Jest");
  } catch {
    // not a JS project
  }

  // requirements.txt / pyproject.toml
  try {
    const req = await fs.readFile(path.join(root, "requirements.txt"), "utf-8");
    if (/django/i.test(req)) frameworks.push("Django");
    if (/flask/i.test(req)) frameworks.push("Flask");
    if (/fastapi/i.test(req)) frameworks.push("FastAPI");
    if (/pandas/i.test(req)) frameworks.push("Pandas");
    if (/numpy/i.test(req)) frameworks.push("NumPy");
  } catch {
    // not Python
  }

  // Cargo.toml
  try {
    const cargo = await fs.readFile(path.join(root, "Cargo.toml"), "utf-8");
    if (/actix/i.test(cargo)) frameworks.push("Actix");
    if (/tokio/i.test(cargo)) frameworks.push("Tokio");
    if (/axum/i.test(cargo)) frameworks.push("Axum");
  } catch {
    // not Rust
  }

  // go.mod
  try {
    const gomod = await fs.readFile(path.join(root, "go.mod"), "utf-8");
    if (/gin-gonic/i.test(gomod)) frameworks.push("Gin");
    if (/echo/i.test(gomod)) frameworks.push("Echo");
  } catch {
    // not Go
  }

  return [...new Set(frameworks)];
}

async function detectStack(root: string, files: { path: string; ext: string }[]): Promise<StackInfo> {
  const frameworks = await detectFrameworks(root);

  // Count lines per language
  const langCounts: Record<string, { files: number; lines: number }> = {};
  let totalFiles = 0;
  let totalLines = 0;

  // Sample up to 200 files for line counting (perf)
  const sample = files.slice(0, 200);
  for (const f of sample) {
    const lang = LANG_BY_EXT[f.ext];
    if (!lang) continue;
    if (!langCounts[lang]) langCounts[lang] = { files: 0, lines: 0 };
    langCounts[lang].files++;
    langCounts[lang].lines += await countLines(f.path);
    totalFiles++;
    totalLines += langCounts[lang].lines;
  }

  // Actually count all files by extension (for the full file count)
  const allByLang: Record<string, number> = {};
  for (const f of files) {
    const lang = LANG_BY_EXT[f.ext];
    if (!lang) continue;
    allByLang[lang] = (allByLang[lang] ?? 0) + 1;
  }

  const sorted = Object.entries(langCounts).sort((a, b) => b[1].lines - a[1].lines);
  const totalSampleLines = sorted.reduce((s, [, v]) => s + v.lines, 0) || 1;
  const languages = sorted.slice(0, 6).map(([name, v]) => ({
    name,
    pct: Math.round((v.lines / totalSampleLines) * 100),
  }));

  const primaryLanguage = sorted[0]?.[0] ?? "Inconnu";

  // Package manager detection
  let packageManager: string | null = null;
  try {
    await fs.access(path.join(root, "package.json"));
    if (await fs.access(path.join(root, "bun.lock")).then(() => true).catch(() => false)) {
      packageManager = "bun";
    } else if (await fs.access(path.join(root, "pnpm-lock.yaml")).then(() => true).catch(() => false)) {
      packageManager = "pnpm";
    } else if (await fs.access(path.join(root, "yarn.lock")).then(() => true).catch(() => false)) {
      packageManager = "yarn";
    } else {
      packageManager = "npm";
    }
  } catch {
    try {
      await fs.access(path.join(root, "requirements.txt"));
      packageManager = "pip";
    } catch {
      // other
    }
  }

  const description = `Projet ${primaryLanguage}${
    frameworks.length ? ` utilisant ${frameworks.slice(0, 3).join(", ")}` : ""
  }. ${files.length} fichiers analysés.`;

  return {
    primaryLanguage,
    languages,
    packageManager,
    frameworks,
    totalFiles: files.length,
    totalLines,
    description,
  };
}

// =========================================================================
// POST /api/repo/scan — scan a local directory
// =========================================================================

export async function POST(req: NextRequest) {
  try {
    const { dirPath } = await req.json();

    if (!dirPath || typeof dirPath !== "string") {
      return NextResponse.json(
        { error: "dirPath is required" },
        { status: 400 }
      );
    }

    // Resolve and validate the path
    const resolved = path.resolve(dirPath);

    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) {
        return NextResponse.json(
          { error: `"${resolved}" is not a directory` },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: `Directory not found: "${resolved}"` },
        { status: 404 }
      );
    }

    // Parse .gitignore
    const ignoreSet = await parseGitignore(resolved);

    // Walk the directory
    const files: { path: string; rel: string; ext: string; size: number }[] = [];
    await walkDir(resolved, resolved, 0, files, ignoreSet);

    // Detect the stack
    const stack = await detectStack(resolved, files);

    // Build a file tree (limited depth for preview)
    const tree = buildFileTree(files.map((f) => f.rel));

    return NextResponse.json({
      path: resolved,
      name: path.basename(resolved),
      stack,
      fileTree: tree,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan error" },
      { status: 500 }
    );
  }
}

function buildFileTree(rels: string[]): unknown {
  const root: Record<string, unknown> = {};
  for (const rel of rels.slice(0, 500)) {
    const parts = rel.split(path.sep);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node[part] = null; // file
      } else {
        if (!node[part] || typeof node[part] !== "object") {
          node[part] = {};
        }
        node = node[part] as Record<string, unknown>;
      }
    }
  }
  return root;
}
