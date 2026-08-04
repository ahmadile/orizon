// =========================================================================
// Orizon — Static Project Analyzer
//
// Scans a project directory and extracts technical information
// without using the LLM. This is fast, deterministic, and always works.
// =========================================================================

import fs from "node:fs/promises";
import path from "node:path";
import type {
  ProjectAnalysis,
  StackInfo,
  ProjectStats,
  ModuleInfo,
  DepInfo,
  ConfigFile,
} from "./types";

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".venv", "venv", "target", "coverage",
  ".idea", ".vscode", ".turbo", ".vercel", ".DS_Store",
  "vendor", "third_party", "bower_components", ".gitlab",
]);

const MAX_FILES = 2000;
const MAX_FILE_SIZE = 300_000; // 300KB

const LANG_BY_EXT: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript",
  ".jsx": "JavaScript", ".mjs": "JavaScript", ".mts": "TypeScript",
  ".py": "Python", ".rb": "Ruby", ".go": "Go", ".rs": "Rust",
  ".java": "Java", ".kt": "Kotlin", ".swift": "Swift", ".c": "C",
  ".cpp": "C++", ".h": "C", ".hpp": "C++", ".cs": "C#", ".php": "PHP",
  ".vue": "Vue", ".svelte": "Svelte", ".html": "HTML", ".css": "CSS",
  ".scss": "CSS", ".less": "CSS", ".json": "JSON", ".yml": "YAML",
  ".yaml": "YAML", ".toml": "TOML", ".md": "Markdown", ".sh": "Shell",
  ".sql": "SQL", ".graphql": "GraphQL", ".prisma": "Prisma",
  ".dockerfile": "Docker", ".tf": "Terraform",
};

// Fichiers clés par type de module
const KEY_FILES = {
  entry: [
    "index.ts", "index.js", "main.ts", "main.js", "app.ts", "app.js",
    "cli.ts", "cli.js", "server.ts", "server.js",
  ],
  api: [
    "src/app/api/", "src/api/", "api/", "routes/", "handlers/",
    "controllers/", "endpoints/", "src/routes/", "src/controllers/",
  ],
  db: [
    "prisma/schema.prisma", "schema.prisma", "models/", "src/models/",
    "db/", "database/", "migrations/", "src/db/", "src/database/",
    "models.py", "schema.sql", "migrations/",
  ],
  test: [
    "test/", "tests/", "__tests__/", "spec/", "src/__tests__/",
    ".test.ts", ".test.js", ".spec.ts", ".spec.js", "_test.go",
  ],
  doc: [
    "README.md", "readme.md", "Readme.md", "docs/", "DOCS.md",
    "CONTRIBUTING.md", "CHANGELOG.md", "API.md",
  ],
  config: [
    "package.json", "tsconfig.json", "next.config.ts", "next.config.js",
    "vite.config.ts", "webpack.config.js", "Dockerfile",
    "docker-compose.yml", ".env.example", "Makefile", "justfile",
    "Cargo.toml", "go.mod", "requirements.txt", "pyproject.toml",
    "tailwind.config.ts", "postcss.config.mjs", "eslint.config.mjs",
    ".prettierrc", ".gitignore", ".editorconfig",
  ],
};

interface FileEntry {
  path: string;
  rel: string;
  ext: string;
  size: number;
  lines: number;
  isDir: boolean;
}

export async function analyzeProject(
  projectPath: string
): Promise<Partial<ProjectAnalysis>> {
  const resolved = path.resolve(projectPath);

  // 1. Walk the directory
  const files: FileEntry[] = [];
  const dirs: string[] = [];
  await walkDir(resolved, resolved, 0, files, dirs);

  if (files.length === 0) {
    return { name: path.basename(resolved), path: resolved, analyzedAt: new Date().toISOString() };
  }

  // 2. Detect stack
  const stack = await detectStack(resolved, files);

  // 3. Calculate stats
  const stats = calculateStats(files, dirs);

  // 4. Detect modules
  const modules = await detectModules(resolved, files, dirs);

  // 5. Detect dependencies
  const dependencies = await detectDependencies(resolved);

  // 6. Detect entry points, API routes, data models, tests
  const { entryPoints, apiRoutes, dataModels, testPatterns } = detectSurfaces(resolved, files);

  // 7. Read config files
  const configFiles = await readConfigFiles(resolved);

  // 8. Build file tree
  const fileTree = buildFileTree(files);

  return {
    name: path.basename(resolved),
    path: resolved,
    analyzedAt: new Date().toISOString(),
    stack,
    stats,
    modules,
    fileTree,
    dependencies,
    entryPoints,
    apiRoutes,
    dataModels,
    testPatterns,
    configFiles,
    contextFiles: [],
    reuseSuggestions: [],
  };
}

// ─── Walk ─────────────────────────────────────────────────────────────────

async function walkDir(
  dir: string,
  root: string,
  depth: number,
  files: FileEntry[],
  dirs: string[]
): Promise<void> {
  if (files.length >= MAX_FILES || depth > 8) return;

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(root, fullPath).replace(/\\/g, "/");

    if (entry.name.startsWith(".") && entry.name !== ".env.example") continue;
    if (IGNORE_DIRS.has(entry.name)) continue;

    if (entry.isDirectory()) {
      dirs.push(rel);
      await walkDir(fullPath, root, depth + 1, files, dirs);
    } else if (entry.isFile()) {
      try {
        const stat = await fs.stat(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;
        const ext = path.extname(entry.name).toLowerCase();
        const content = await fs.readFile(fullPath, "utf-8").catch(() => "");
        const lines = content.split("\n").length;
        files.push({ path: fullPath, rel, ext, size: stat.size, lines, isDir: false });
      } catch {
        // skip
      }
    }
  }
}

// ─── Stack detection ──────────────────────────────────────────────────────

async function detectStack(root: string, files: FileEntry[]): Promise<StackInfo> {
  const frameworks: string[] = [];
  let packageManager: string | null = null;
  let runtime: string | null = null;

  // package.json
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf-8"));
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
    if (deps["next-auth"] || deps["next-auth/react"]) frameworks.push("NextAuth");

    runtime = "Node.js";
    try {
      await fs.access(path.join(root, "bun.lock"));
      packageManager = "bun";
    } catch {
      try {
        await fs.access(path.join(root, "pnpm-lock.yaml"));
        packageManager = "pnpm";
      } catch {
        try {
          await fs.access(path.join(root, "yarn.lock"));
          packageManager = "yarn";
        } catch {
          packageManager = "npm";
        }
      }
    }
  } catch {
    // not JS/TS
  }

  // Python
  try {
    await fs.access(path.join(root, "requirements.txt"));
    packageManager = "pip";
    runtime = "Python";
    const req = await fs.readFile(path.join(root, "requirements.txt"), "utf-8");
    if (/django/i.test(req)) frameworks.push("Django");
    if (/flask/i.test(req)) frameworks.push("Flask");
    if (/fastapi/i.test(req)) frameworks.push("FastAPI");
  } catch {
    // try pyproject.toml
    try {
      await fs.access(path.join(root, "pyproject.toml"));
      packageManager = "pip";
      runtime = "Python";
    } catch {
      // not Python
    }
  }

  // Rust
  try {
    await fs.access(path.join(root, "Cargo.toml"));
    packageManager = "cargo";
    runtime = "Rust";
  } catch {
    // not Rust
  }

  // Go
  try {
    await fs.access(path.join(root, "go.mod"));
    packageManager = "go";
    runtime = "Go";
  } catch {
    // not Go
  }

  // Lang par extension
  const langCounts: Record<string, number> = {};
  for (const f of files) {
    const lang = LANG_BY_EXT[f.ext];
    if (lang) langCounts[lang] = (langCounts[lang] ?? 0) + f.lines;
  }
  const total = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
  const languages = sorted.slice(0, 6).map(([name, lines]) => ({
    name,
    pct: Math.round((lines / total) * 100),
  }));

  return {
    primaryLanguage: sorted[0]?.[0] ?? "Inconnu",
    languages,
    frameworks: [...new Set(frameworks)],
    packageManager,
    runtime,
  };
}

// ─── Stats ─────────────────────────────────────────────────────────────────

function calculateStats(files: FileEntry[], dirs: string[]): ProjectStats {
  const testFiles = files.filter((f) =>
    /\.(test|spec)\./.test(f.rel) || 
    f.rel.includes("/test/") || f.rel.includes("/tests/") || f.rel.includes("/__tests__/")
  );
  const docFiles = files.filter((f) => f.ext === ".md" || f.rel.includes("/docs/"));
  const configCount = files.filter((f) => 
    [".json", ".yml", ".yaml", ".toml"].includes(f.ext) || 
    f.rel === "package.json" || f.rel === "tsconfig.json"
  ).length;

  return {
    totalFiles: files.length,
    totalLines: files.reduce((s, f) => s + f.lines, 0),
    totalDirs: dirs.length,
    testFiles: testFiles.length,
    testLines: testFiles.reduce((s, f) => s + f.lines, 0),
    docFiles: docFiles.length,
    configFiles: configCount,
  };
}

// ─── Modules ───────────────────────────────────────────────────────────────

async function detectModules(root: string, files: FileEntry[], dirs: string[]): Promise<ModuleInfo[]> {
  const modules: ModuleInfo[] = [];
  const seen = new Set<string>();

  // Chercher les sous-dossiers de src/ qui sont des modules
  const srcSubdirs = dirs
    .filter((d) => d.startsWith("src/") && d.split("/").length === 2)
    .map((d) => d.replace("src/", ""));

  // Modules racine directs
  const rootModules = dirs
    .filter((d) => !d.includes("/") && !d.startsWith("."))
    .filter((d) => 
      ["src", "lib", "app", "api", "db", "prisma", "components", "pages",
       "backend", "frontend", "routes", "controllers", "models", "database",
       "tests", "test", "e2e", "docs", "scripts", "config",
       "public", "assets", "static", "migrations", "hooks", "utils", "helpers",
       "types", "styles", "services", "middleware", "layouts", "features"].includes(d)
    );

  // Combiner les deux listes : "src/lib" + "lib"
  const allModules = [...new Set([...srcSubdirs, ...rootModules])];

  for (const modName of allModules) {
    if (seen.has(modName)) continue;
    seen.add(modName);

    // Le chemin réel peut être src/lib ou lib selon le projet
    const possiblePaths = [
      path.join(root, "src", modName),
      path.join(root, modName),
    ];

    // Version synchrone avec fs.access
    let resolvedPath = "";
    try {
      await fs.access(possiblePaths[0]);
      resolvedPath = possiblePaths[0];
    } catch {
      try {
        await fs.access(possiblePaths[1]);
        resolvedPath = possiblePaths[1];
      } catch {}
    }

    const prefix = resolvedPath.includes("src") ? "src/" + modName + "/" : modName + "/";
    const dirFiles = files.filter((f) => f.rel.startsWith(prefix));
    const kind = detectModuleKind(modName);

    modules.push({
      name: modName,
      path: resolvedPath || possiblePaths[1],
      kind,
      description: describeModuleKind(kind),
      keyFiles: dirFiles.slice(0, 5).map((f) => f.rel),
      fileCount: dirFiles.length,
      lines: dirFiles.reduce((s, f) => s + f.lines, 0),
      isReusable: isReusableModule(modName, kind),
      reuseRationale: isReusableModule(modName, kind) ? describeReuseRationale(modName, kind) : undefined,
    });
  }

  // Si aucun module racine, créer un module "application" avec tout
  if (modules.length === 0) {
    modules.push({
      name: "application",
      path: root,
      kind: "app",
      description: "Code source principal de l'application",
      keyFiles: files.slice(0, 5).map((f) => f.rel),
      fileCount: files.length,
      lines: files.reduce((s, f) => s + f.lines, 0),
      isReusable: false,
    });
  }

  return modules;
}

function detectModuleKind(name: string): ModuleInfo["kind"] {
  if (["src", "app", "lib"].includes(name)) return "app";
  if (["api", "routes", "controllers", "handlers", "endpoints"].includes(name)) return "api";
  if (["db", "database", "models", "prisma", "migrations", "schema"].includes(name)) return "db";
  if (["test", "tests", "spec", "e2e", "__tests__"].includes(name)) return "test";
  if (["docs", "documentation", "wiki"].includes(name)) return "docs";
  if (["scripts", "tasks", "bin", "cli"].includes(name)) return "scripts";
  if (["public", "assets", "static", "images", "fonts", "styles"].includes(name)) return "assets";
  if (["config", "configuration", "settings"].includes(name)) return "config";
  return "other";
}

function describeModuleKind(kind: ModuleInfo["kind"]): string {
  const descriptions: Record<string, string> = {
    app: "Code source principal de l'application",
    api: "Interface de programmation (API endpoints)",
    db: "Couche de données et modèles",
    test: "Tests automatisés",
    docs: "Documentation",
    scripts: "Scripts d'automatisation et outils",
    assets: "Ressources statiques (images, styles, etc.)",
    config: "Fichiers de configuration",
    other: "Autres fichiers",
  };
  return descriptions[kind] ?? "Autres fichiers";
}

function isReusableModule(name: string, kind: ModuleInfo["kind"]): boolean {
  return ["api", "db", "lib", "auth", "utils", "helpers", "components", "hooks"].includes(name) ||
    kind === "api" || kind === "db";
}

function describeReuseRationale(name: string, kind: ModuleInfo["kind"]): string {
  if (kind === "api") return "Les endpoints API peuvent être réutilisés dans un autre projet backend";
  if (kind === "db") return "Les modèles de données et migrations peuvent être réutilisés dans un autre projet";
  if (["lib", "utils", "helpers"].includes(name)) return "Les utilitaires sont généralement indépendants et réutilisables";
  if (name === "auth") return "Le système d'authentification peut être adapté pour un autre projet";
  if (name === "components") return "Les composants UI peuvent être extraits dans une bibliothèque partagée";
  if (name === "hooks") return "Les hooks React peuvent être extraits et réutilisés";
  return "Ce module a un potentiel de réutilisation";
}

// ─── Dependencies ─────────────────────────────────────────────────────────

async function detectDependencies(root: string): Promise<DepInfo[]> {
  const deps: DepInfo[] = [];

  // package.json
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf-8"));
    for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
      deps.push({
        name,
        version: version as string,
        kind: "runtime",
        role: describeDependency(name),
        isReusable: isReusableDependency(name),
      });
    }
    for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
      deps.push({
        name,
        version: version as string,
        kind: "dev",
        role: describeDependency(name),
        isReusable: false,
      });
    }
  } catch {
    // not JS/TS
  }

  // requirements.txt
  try {
    const req = await fs.readFile(path.join(root, "requirements.txt"), "utf-8");
    for (const line of req.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [name, ver] = trimmed.split("==").map((s) => s.trim());
      deps.push({
        name: name ?? trimmed,
        version: ver ?? "*",
        kind: "runtime",
        role: describeDependency(name ?? trimmed),
        isReusable: true,
      });
    }
  } catch {
    // not Python
  }

  // Cargo.toml
  try {
    const cargo = await fs.readFile(path.join(root, "Cargo.toml"), "utf-8");
    const depSection = cargo.match(/\[dependencies\]([\s\S]*?)(?=\[\w+\]|$)/);
    if (depSection) {
      for (const line of depSection[1].split("\n")) {
        const match = line.match(/^(\w+)\s*=\s*"([^"]+)"/);
        if (match) {
          deps.push({
            name: match[1],
            version: match[2],
            kind: "runtime",
            role: describeDependency(match[1]),
            isReusable: true,
          });
        }
      }
    }
  } catch {
    // not Rust
  }

  return deps;
}

function describeDependency(name: string): string {
  const descriptions: Record<string, string> = {
    next: "Framework React full-stack",
    react: "Bibliothèque UI",
    "react-dom": "Rendu DOM React",
    "@prisma/client": "ORM base de données",
    prisma: "ORM base de données (CLI)",
    "next-auth": "Authentification Next.js",
    "@tanstack/react-query": "Gestion d'état serveur",
    zustand: "Gestion d'état globale",
    zod: "Validation de schémas",
    "react-hook-form": "Gestion de formulaires",
    "framer-motion": "Animations",
    tailwindcss: "Framework CSS utilitaire",
    "@radix-ui/react-dialog": "Composant UI (Dialog)",
    lucide: "Icônes",
    date: "Manipulation de dates",
    "chart.js": "Graphiques",
    recharts: "Graphiques React",
    axios: "Client HTTP",
    express: "Framework serveur HTTP",
    fastify: "Framework serveur HTTP",
    fastapi: "Framework API Python",
    django: "Framework web Python",
    flask: "Framework web Python",
    sqlalchemy: "ORM Python",
    pandas: "Analyse de données",
    numpy: "Calcul numérique",
    serde: "Sérialisation Rust",
    tokio: "Runtime asynchrone Rust",
    axum: "Framework web Rust",
  };
  return descriptions[name] ?? "Dépendance externe";
}

function isReusableDependency(name: string): boolean {
  const reusable = [
    "react", "react-dom", "zustand", "zod", "react-hook-form",
    "framer-motion", "lucide", "axios", "sqlalchemy", "pandas",
    "numpy", "serde", "tokio",
  ];
  return reusable.includes(name);
}

// ─── Surfaces ─────────────────────────────────────────────────────────────

function detectSurfaces(root: string, files: FileEntry[]) {
  const entryPoints: string[] = [];
  const apiRoutes: string[] = [];
  const dataModels: string[] = [];
  const testPatterns: string[] = [];

  for (const f of files) {
    const rel = f.rel;

    // Entry points
    if (KEY_FILES.entry.some((e) => rel.endsWith(e))) {
      entryPoints.push(rel);
    }

    // API routes
    if (KEY_FILES.api.some((a) => rel.includes(a))) {
      apiRoutes.push(rel);
    }

    // Data models
    if (KEY_FILES.db.some((d) => rel.includes(d) || rel.endsWith(d))) {
      dataModels.push(rel);
    }

    // Test files
    if (KEY_FILES.test.some((t) => rel.includes(t) || rel.endsWith(t))) {
      testPatterns.push(rel);
    }
  }

  return {
    entryPoints: [...new Set(entryPoints)].slice(0, 10),
    apiRoutes: [...new Set(apiRoutes)].slice(0, 20),
    dataModels: [...new Set(dataModels)].slice(0, 10),
    testPatterns: [...new Set(testPatterns)].slice(0, 10),
  };
}

// ─── Config files ─────────────────────────────────────────────────────────

async function readConfigFiles(root: string): Promise<ConfigFile[]> {
  const configs: ConfigFile[] = [];

  for (const name of KEY_FILES.config) {
    try {
      const fullPath = path.join(root, name);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n").length;
      configs.push({
        path: fullPath,
        name,
        content: content.slice(0, 2000),
        lines,
      });
    } catch {
      // not found
    }
  }

  return configs.slice(0, 15); // max 15 config files
}

// ─── File tree ────────────────────────────────────────────────────────────

function buildFileTree(files: FileEntry[]): string {
  const tree: string[] = [];
  const dirs = new Set<string>();

  for (const f of files) {
    const parts = f.rel.split("/");
    for (let i = 0; i < parts.length - 1; i++) {
      dirs.add(parts.slice(0, i + 1).join("/"));
    }
  }

  const sortedDirs = [...dirs].sort();
  const sortedFiles = files.map((f) => f.rel).sort();

  for (const d of sortedDirs) {
    const depth = d.split("/").length;
    const name = d.split("/").pop();
    tree.push("  ".repeat(depth) + "📁 " + name + "/");
  }

  for (const f of sortedFiles.slice(0, 300)) {
    const depth = f.split("/").length;
    const name = f.split("/").pop();
    tree.push("  ".repeat(depth) + "📄 " + name);
  }

  if (sortedFiles.length > 300) {
    tree.push(`  ... (${sortedFiles.length - 300} fichiers supplémentaires)`);
  }

  return tree.join("\n");
}