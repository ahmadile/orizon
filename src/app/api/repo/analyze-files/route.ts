import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANG_BY_EXT: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript",
  ".js": "JavaScript", ".jsx": "JavaScript", ".mjs": "JavaScript",
  ".py": "Python", ".rb": "Ruby", ".go": "Go", ".rs": "Rust",
  ".java": "Java", ".kt": "Kotlin", ".swift": "Swift",
  ".c": "C", ".cpp": "C++", ".h": "C", ".hpp": "C++",
  ".cs": "C#", ".php": "PHP", ".vue": "Vue", ".svelte": "Svelte",
  ".html": "HTML", ".css": "CSS", ".scss": "CSS", ".less": "CSS",
  ".json": "JSON", ".yml": "YAML", ".yaml": "YAML", ".toml": "TOML",
  ".md": "Markdown", ".sh": "Shell", ".sql": "SQL",
};

function extOf(p: string): string {
  const i = p.lastIndexOf(".");
  return i >= 0 ? p.slice(i).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    const { folderName, files } = await req.json() as {
      folderName: string;
      files: { path: string; content: string }[];
    };

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Count lines per language
    const langCounts: Record<string, { files: number; lines: number }> = {};
    let totalFiles = 0;
    let totalLines = 0;

    // Detect frameworks from package.json / requirements.txt content
    const frameworks: string[] = [];
    let packageManager: string | null = null;

    for (const f of files) {
      const ext = extOf(f.path);
      const lang = LANG_BY_EXT[ext];
      if (lang) {
        if (!langCounts[lang]) langCounts[lang] = { files: 0, lines: 0 };
        langCounts[lang].files++;
        const lines = f.content.split("\n").length;
        langCounts[lang].lines += lines;
        totalLines += lines;
        totalFiles++;
      }

      // Detect package.json
      if (f.path.endsWith("package.json")) {
        try {
          const pkg = JSON.parse(f.content);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (deps["next"]) frameworks.push("Next.js");
          if (deps["react"]) frameworks.push("React");
          if (deps["vue"]) frameworks.push("Vue");
          if (deps["svelte"]) frameworks.push("Svelte");
          if (deps["express"]) frameworks.push("Express");
          if (deps["vite"]) frameworks.push("Vite");
          if (deps["tailwindcss"]) frameworks.push("Tailwind CSS");
          if (deps["prisma"]) frameworks.push("Prisma");
          if (deps["vitest"]) frameworks.push("Vitest");
          packageManager = "npm";
        } catch {
          // invalid json
        }
      }

      if (f.path.endsWith("requirements.txt")) {
        packageManager = "pip";
        if (/django/i.test(f.content)) frameworks.push("Django");
        if (/flask/i.test(f.content)) frameworks.push("Flask");
        if (/fastapi/i.test(f.content)) frameworks.push("FastAPI");
      }

      if (f.path.endsWith("Cargo.toml")) {
        packageManager = "cargo";
        if (/actix/i.test(f.content)) frameworks.push("Actix");
        if (/tokio/i.test(f.content)) frameworks.push("Tokio");
      }

      if (f.path.endsWith("go.mod")) {
        packageManager = "go";
      }
    }

    const sorted = Object.entries(langCounts).sort((a, b) => b[1].lines - a[1].lines);
    const totalSampleLines = sorted.reduce((s, [, v]) => s + v.lines, 0) || 1;
    const languages = sorted.slice(0, 6).map(([name, v]) => ({
      name,
      pct: Math.round((v.lines / totalSampleLines) * 100),
    }));

    const primaryLanguage = sorted[0]?.[0] ?? "Inconnu";

    // Try to detect bun/yarn/pnpm from lock files
    if (files.some((f) => f.path.endsWith("bun.lock"))) packageManager = "bun";
    if (files.some((f) => f.path.endsWith("pnpm-lock.yaml"))) packageManager = "pnpm";
    if (files.some((f) => f.path.endsWith("yarn.lock"))) packageManager = "yarn";

    return NextResponse.json({
      path: folderName,
      name: folderName,
      stack: {
        primaryLanguage,
        languages,
        packageManager,
        frameworks: [...new Set(frameworks)],
        totalFiles,
        totalLines,
        description: `Projet ${primaryLanguage}${
          frameworks.length ? ` utilisant ${frameworks.slice(0, 3).join(", ")}` : ""
        }. ${totalFiles} fichiers analysés.`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis error" },
      { status: 500 }
    );
  }
}
