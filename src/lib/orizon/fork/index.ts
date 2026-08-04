// =========================================================================
// Orizon — Fork Engine
//
// Creates a new project (fork) from an existing open source project by
// copying reusable modules, adapting configs, and generating context files.
// =========================================================================

import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { analyzeProject } from "@/lib/orizon/analyzer";
import { generateContextFiles } from "@/lib/orizon/context";
import type { ForkOptions, ForkResult, ModuleAction, ConfigAction } from "./types";

const execAsync = promisify(exec);

const CONFIG_FILES_TO_COPY = [
  "package.json", "tsconfig.json", "next.config.ts", "next.config.js",
  "vite.config.ts", "webpack.config.js", "tailwind.config.ts",
  "postcss.config.mjs", "eslint.config.mjs", ".prettierrc",
  ".env.example", "Dockerfile", "docker-compose.yml",
  "Makefile", "justfile", ".gitignore",
];

/**
 * Fork a project: copy reusable modules + config + generate context.
 */
export async function createFork(options: ForkOptions): Promise<ForkResult> {
  const {
    sourcePath,
    targetPath,
    projectName,
    includeReusable = true,
    includeConfig = true,
    initGit = true,
    initialCommit = true,
    intention,
  } = options;

  const warnings: string[] = [];
  const copiedModules: string[] = [];
  const skippedModules: string[] = [];
  const configFiles: string[] = [];
  const contextFiles: string[] = [];

  // 1. Analyser le projet source
  const analysis = await analyzeProject(sourcePath, { agentic: false });

  if (analysis.stats.totalFiles === 0) {
    return {
      success: false,
      targetPath,
      copiedFiles: 0,
      copiedModules: [],
      skippedModules: [],
      configFiles: [],
      projectStructure: "",
      contextFiles: [],
      gitInitialized: false,
      warnings: ["Projet source vide ou inaccessible"],
    };
  }

  // 2. Déterminer les modules à copier
  const selectedModules = options.modules?.length
    ? options.modules
    : includeReusable
      ? analysis.modules.filter((m) => m.isReusable).map((m) => m.name)
      : [];

  const moduleActions = generateModuleActions(analysis, selectedModules);
  const configActions = generateConfigActions(analysis, includeConfig);

  // 3. Créer le dossier cible
  try {
    await fs.mkdir(targetPath, { recursive: true });
  } catch (err) {
    return {
      success: false,
      targetPath,
      copiedFiles: 0,
      copiedModules: [],
      skippedModules: [],
      configFiles: [],
      projectStructure: "",
      contextFiles: [],
      gitInitialized: false,
      warnings: [`Impossible de créer le dossier cible: ${err}`],
    };
  }

  // 4. Copier les modules sélectionnés
  let totalCopied = 0;

  for (const action of moduleActions) {
    if (action.action === "skip") {
      skippedModules.push(action.moduleName);
      continue;
    }

    const moduleInfo = analysis.modules.find((m) => m.name === action.moduleName);
    if (!moduleInfo) {
      skippedModules.push(action.moduleName);
      continue;
    }

    try {
      // Vérifier que le dossier source existe
      if (moduleInfo.fileCount === 0) {
        skippedModules.push(action.moduleName);
        continue;
      }

      // Copier le dossier du module
      const moduleRelPath = path.relative(sourcePath, moduleInfo.path);
      const targetModulePath = path.join(targetPath, moduleRelPath);
      await copyDir(moduleInfo.path, targetModulePath);

      copiedModules.push(action.moduleName);
      totalCopied += moduleInfo.fileCount;
    } catch (err) {
      warnings.push(`Module ${action.moduleName}: erreur de copie (${err})`);
      skippedModules.push(action.moduleName);
    }
  }

  // 5. Copier/adapter les fichiers de configuration
  if (includeConfig) {
    for (const action of configActions) {
      if (action.action === "skip") continue;

      const srcFile = path.join(sourcePath, action.file);
      const destFile = path.join(targetPath, action.file);

      try {
        await fs.access(srcFile);
        const content = await fs.readFile(srcFile, "utf-8");

        if (action.action === "adapt") {
          // Adapter le contenu (ex: changer le nom du projet)
          let adapted = content;
          if (action.file === "package.json") {
            const pkg = JSON.parse(adapted);
            pkg.name = projectName;
            pkg.version = "0.1.0";
            pkg.description = intention 
              ? `Fork de ${analysis.name} — ${intention}`
              : `Fork de ${analysis.name}`;
            adapted = JSON.stringify(pkg, null, 2);
          }
          await fs.mkdir(path.dirname(destFile), { recursive: true });
          await fs.writeFile(destFile, adapted, "utf-8");
        } else {
          // Copie simple
          await fs.mkdir(path.dirname(destFile), { recursive: true });
          await fs.writeFile(destFile, content, "utf-8");
        }
        configFiles.push(action.file);
        totalCopied++;
      } catch {
        // Fichier non trouvé, on skip
      }
    }
  }

  // 6. Générer le PROJECT_STRUCTURE.md
  const projectStructure = generateProjectStructure(
    analysis, projectName, moduleActions, copiedModules, intention
  );
  await fs.writeFile(path.join(targetPath, "PROJECT_STRUCTURE.md"), projectStructure, "utf-8");
  totalCopied++;

  // 7. Générer les fichiers de contexte avancés (pour tous les agents)
  const generatedFiles = generateContextFiles(analysis, intention);
  for (const ctx of generatedFiles) {
    const ctxPath = path.join(targetPath, ctx.filename);
    await fs.writeFile(ctxPath, ctx.content, "utf-8");
    contextFiles.push(ctx.filename);
    totalCopied++;
  }

  // 8. Initialiser git
  let gitInitialized = false;
  if (initGit) {
    try {
      await execAsync(`git init "${targetPath}"`, { timeout: 10_000 });
      gitInitialized = true;

      if (initialCommit) {
        await execAsync(
          `git -C "${targetPath}" add . && git -C "${targetPath}" commit -m "Initial fork from ${analysis.name}"`,
          { timeout: 15_000 }
        );
      }
    } catch (err) {
      warnings.push(`Git init: ${err}`);
    }
  }

  return {
    success: true,
    targetPath,
    copiedFiles: totalCopied,
    copiedModules,
    skippedModules,
    configFiles,
    projectStructure,
    contextFiles,
    gitInitialized,
    warnings,
  };
}

// ─── Module strategy ──────────────────────────────────────────────────────

function generateModuleActions(
  analysis: ReturnType<typeof analyzeProject> extends Promise<infer T> ? T : never,
  selectedModules: string[]
): ModuleAction[] {
  // Use a simpler approach since we can't use the generic properly
  const modules = (analysis as any).modules ?? [];
  return modules.map((m: any) => {
    const isSelected = selectedModules.includes(m.name);
    return {
      moduleName: m.name,
      action: isSelected ? "keep" : "skip",
      rationale: isSelected
        ? (m.reuseRationale || "Module sélectionné pour le fork")
        : "Module non inclus dans ce fork",
    };
  }) as ModuleAction[];
}

function generateConfigActions(
  _analysis: any,
  includeConfig: boolean
): ConfigAction[] {
  if (!includeConfig) return [];

  return CONFIG_FILES_TO_COPY.map((file) => ({
    file,
    action: file === "package.json" ? "adapt" : "copy" as "adapt" | "copy",
    rationale: file === "package.json"
      ? "Adapter le nom et la version du projet"
      : "Copier la configuration",
  }));
}

// ─── Project structure generator ──────────────────────────────────────────

function generateProjectStructure(
  _analysis: any,
  projectName: string,
  moduleActions: ModuleAction[],
  copiedModules: string[],
  intention?: string
): string {
  const lines = [
    `# PROJECT STRUCTURE — ${projectName}`,
    `Généré par Orizon — ${new Date().toISOString().slice(0, 10)}`,
    intention ? `\nIntention : ${intention}` : "",
    "",
    "## Stack technique",
    `- Runtime : Node.js`,
    `- Langage : TypeScript`,
    "",
    "## Modules inclus",
    ...moduleActions
      .filter((a) => a.action !== "skip")
      .map((a) => `- **${a.moduleName}** — ${a.rationale}`),
    "",
    "## Modules ignorés",
    ...moduleActions
      .filter((a) => a.action === "skip")
      .map((a) => `- ${a.moduleName} — ${a.rationale}`),
    "",
    "## Prochaines étapes",
    "1. Installer les dépendances : `npm install`",
    "2. Configurer les variables d'environnement",
    "3. Lancer le développement : `npm run dev`",
    "4. Utiliser Orizon pour guider les modifications",
    "",
    "## Fichiers de contexte",
    "- `CONTEXT-PI.md` — instructions detaillees pour Pi",
    "- `CLAUDE.md` — regles de projet pour Claude Code",
    "- `CONVENTIONS.md` — conventions de code pour Aider",
    "- `.cursorrules` — regles et contexte pour Cursor",
    "- `continue.md` — contexte pour Continue.dev",
    "- `README-AGENT.md` — contexte universel pour tout agent",
  ];
  return lines.join("\n");
}

// ─── File copy utility ────────────────────────────────────────────────────

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}