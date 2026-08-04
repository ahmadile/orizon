// =========================================================================
// Orizon — Advanced Context Generator
//
// Generates context files tailored to each AI coding agent's native format:
//   - Pi            → CONTEXT-PI.md (self-contained instructions)
//   - Claude Code   → CLAUDE.md (project rules)
//   - Aider         → CONVENTIONS.md (coding conventions)
//   - Cursor        → .cursorrules (project context + rules)
//   - Continue.dev  → continue.md (agent context)
//   - Général       → README-AGENT.md (universal)
//
// Each file tells the agent:
//   1. What the project is (stack, architecture, modules)
//   2. What to do (task / intention)
//   3. How to work (conventions, constraints, context files to read)
// =========================================================================

import type { ProjectAnalysis } from "@/lib/orizon/analyzer";
import type { ContextFile, ContextTarget } from "./types";

export type { ContextFile, ContextTarget };

/**
 * Generate context files for all agents based on the project analysis
 * and an optional task description.
 */
export function generateContextFiles(
  analysis: ProjectAnalysis,
  task?: string
): ContextFile[] {
  return [
    generatePiContext(analysis, task),
    generateClaudeContext(analysis, task),
    generateAiderContext(analysis, task),
    generateCursorContext(analysis, task),
    generateContinueContext(analysis, task),
    generateUniversalContext(analysis, task),
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function stackLines(a: ProjectAnalysis): string[] {
  const lines = [
    "- Langage principal : " + a.stack.primaryLanguage,
    "- Frameworks : " + (a.stack.frameworks.join(", ") || "N/A"),
    "- Runtime : " + (a.stack.runtime ?? "N/A"),
    "- Package manager : " + (a.stack.packageManager ?? "N/A"),
  ];
  return lines;
}

function moduleLines(a: ProjectAnalysis): string[] {
  return a.modules.map((m) => {
    const reusable = m.isReusable ? " (reutilisable)" : "";
    return `- ${m.name} [${m.kind}] : ${m.description} — ${m.fileCount} fichiers${reusable}`;
  });
}

function entryPointLines(a: ProjectAnalysis): string[] {
  return a.entryPoints.length
    ? a.entryPoints.map((e) => `- ${e}`)
    : ["- (aucun détecte)"];
}

function apiLines(a: ProjectAnalysis): string[] {
  return a.apiRoutes.length
    ? a.apiRoutes.map((r) => `- ${r}`)
    : ["- (aucune détectee)"];
}

function depLines(a: ProjectAnalysis, max = 15): string[] {
  return a.dependencies.slice(0, max).map((d) => {
    const reusable = d.isReusable ? " (reutilisable)" : "";
    return `- ${d.name}@${d.version} : ${d.role}${reusable}`;
  });
}

function dataModelLines(a: ProjectAnalysis): string[] {
  return a.dataModels.length
    ? a.dataModels.map((m) => `- ${m}`)
    : ["- (aucun detecte)"];
}

function testLines(a: ProjectAnalysis): string[] {
  return a.testPatterns.length
    ? a.testPatterns.map((t) => `- ${t}`)
    : ["- (aucun test detecte)"];
}

// ─── Pi ───────────────────────────────────────────────────────────────────

function generatePiContext(a: ProjectAnalysis, task?: string): ContextFile {
  const lines = [
    "# Contexte de projet pour Pi — " + a.name,
    "",
    "> Genere par Orizon — " + new Date().toISOString().slice(0, 10),
    "",
    task ? "## Mission" : "## Contexte",
    task ? task : "Vous travaillez sur le projet " + a.name + ". Comprenez d'abord le projet, puis proposez les prochaines etapes.",
    "",
    "## Presentation du projet",
    ...stackLines(a),
    "",
    "### Statistiques",
    "- Fichiers : " + a.stats.totalFiles,
    "- Lignes : " + a.stats.totalLines,
    "- Tests : " + a.stats.testFiles + " fichiers",
    "- Documentation : " + a.stats.docFiles + " fichiers",
    "",
    "## Architecture",
    ...moduleLines(a),
    "",
    "## Points d'entree",
    ...entryPointLines(a),
    "",
    "## Routes API",
    ...apiLines(a),
    "",
    "## Modeles de donnees",
    ...dataModelLines(a),
    "",
    "## Dependances principales",
    ...depLines(a),
    "",
    "## Tests existants",
    ...testLines(a),
    "",
    "## Instructions pour Pi",
    "1. Commencez par lire PROJECT_STRUCTURE.md et les fichiers d'entree si presents.",
    "2. Explorez l'arborescence avec list_directory avant de lire des fichiers.",
    "3. Utilisez read_file pour comprendre le code avant de le modifier.",
    "4. Utilisez search_code pour retrouver les patterns pertinents.",
    "5. Utilisez write_file pour creer ou modifier des fichiers.",
    "6. Repondez en francais.",
    "7. Ne supprimez jamais un fichier sans confirmation explicite de l'utilisateur.",
    "8. Apres chaque modification, verifiez que le projet compile/tourne.",
    "",
    "## Fichiers de reference",
    "- ORIZON-ANALYSIS.md : analyse complete du projet source",
    "- PROJECT_STRUCTURE.md : structure du projet cible",
    "",
  ];

  return {
    filename: "CONTEXT-PI.md",
    description: "Instructions detaillees pour Pi (agent de codage Orizon)",
    target: "pi",
    content: lines.join("\n"),
  };
}

// ─── Claude Code ──────────────────────────────────────────────────────────

function generateClaudeContext(a: ProjectAnalysis, task?: string): ContextFile {
  const lines = [
    "# CLAUDE.md",
    "",
    "> Genere par Orizon — " + new Date().toISOString().slice(0, 10),
    "",
    "## Project Overview",
    a.name + " — " + a.stack.primaryLanguage + " project using " + (a.stack.frameworks.join(", ") || "no framework"),
    a.stats.totalFiles + " files, " + a.stats.totalLines + " lines of code.",
    "",
    task ? "## Mission\n" + task : "",
    "",
    "## Tech Stack",
    ...stackLines(a),
    "",
    "## Project Structure",
    ...moduleLines(a),
    "",
    "## Entry Points",
    ...entryPointLines(a),
    "",
    "## Key Config Files",
    ...a.configFiles.map((c) => "- " + c.name),
    "",
    "## Dependencies",
    ...depLines(a),
    "",
    "## Coding Conventions",
    "1. Read files before modifying them.",
    "2. Follow existing code style (indentation, naming, imports order).",
    "3. Keep TypeScript strict mode enabled.",
    "4. Add tests for new functionality when the project has a test setup.",
    "5. Run the build before finishing: `npm run build` (or the project's equivalent).",
    "6. Reply in French when the user writes in French.",
    "",
    "## Guardrails",
    "- Do not expose API keys or secrets.",
    "- Do not delete files without explicit user confirmation.",
    "- If a change affects multiple modules, explain the blast radius first.",
    "",
  ];

  return {
    filename: "CLAUDE.md",
    description: "Regles de projet pour Claude Code",
    target: "claude-code",
    content: lines.join("\n"),
  };
}

// ─── Aider ────────────────────────────────────────────────────────────────

function generateAiderContext(a: ProjectAnalysis, task?: string): ContextFile {
  const lines = [
    "# CONVENTIONS.md",
    "",
    "> Genere par Orizon — " + new Date().toISOString().slice(0, 10),
    "",
    "## Project",
    a.name + " : " + a.stack.primaryLanguage + " / " + (a.stack.frameworks.join(", ") || "N/A"),
    "",
    task ? "## Task\n" + task + "\n" : "",
    "## Architecture Notes",
    ...moduleLines(a),
    "",
    "## Key Entry Points",
    ...entryPointLines(a),
    "",
    "## Conventions",
    "- Use the project's existing style.",
    "- Do not reformat files that are not part of the task.",
    "- Keep imports organized (standard lib, external, internal).",
    "- Prefer small, focused commits.",
    "- When adding a dependency, justify it in the commit message.",
    "",
    "## Testing",
    ...testLines(a),
    "",
  ];

  return {
    filename: "CONVENTIONS.md",
    description: "Conventions de code pour Aider",
    target: "aider",
    content: lines.join("\n"),
  };
}

// ─── Cursor ───────────────────────────────────────────────────────────────

function generateCursorContext(a: ProjectAnalysis, task?: string): ContextFile {
  const lines = [
    "# .cursorrules",
    "",
    "> Genere par Orizon — " + new Date().toISOString().slice(0, 10),
    "",
    "## Project Context",
    "- Project: " + a.name,
    "- Language: " + a.stack.primaryLanguage,
    "- Frameworks: " + (a.stack.frameworks.join(", ") || "N/A"),
    "- Runtime: " + (a.stack.runtime ?? "N/A"),
    "",
    task ? "## Mission\n" + task + "\n" : "",
    "## Architecture",
    ...moduleLines(a),
    "",
    "## Entry Points",
    ...entryPointLines(a),
    "",
    "## Rules",
    "1. Understand the existing code before adding new abstractions.",
    "2. Use the same patterns as the existing codebase.",
    "3. Prefer composition over inheritance.",
    "4. Keep functions small and focused.",
    "5. Use TypeScript strict mode.",
    "6. Do not introduce unnecessary dependencies.",
    "7. Follow existing naming conventions.",
    "",
    "## Security",
    "- Never commit API keys or secrets.",
    "- Validate all user input.",
    "- Use parameterized queries for database access.",
    "",
  ];

  return {
    filename: ".cursorrules",
    description: "Regles et contexte pour Cursor",
    target: "cursor",
    content: lines.join("\n"),
  };
}

// ─── Continue.dev ─────────────────────────────────────────────────────────

function generateContinueContext(a: ProjectAnalysis, task?: string): ContextFile {
  const lines = [
    "# continue.md",
    "",
    "> Genere par Orizon — " + new Date().toISOString().slice(0, 10),
    "",
    "## Project",
    a.name + " : " + a.stack.primaryLanguage,
    "",
    task ? "## Mission\n" + task + "\n" : "",
    "## Stack",
    ...stackLines(a),
    "",
    "## Structure",
    ...moduleLines(a),
    "",
    "## Dependencies",
    ...depLines(a, 10),
    "",
    "## Conventions",
    "- Follow the project's existing code style.",
    "- Use the entry points listed above to understand the app flow.",
    "- Run lint and build before finishing.",
    "",
  ];

  return {
    filename: "continue.md",
    description: "Contexte pour Continue.dev",
    target: "continue",
    content: lines.join("\n"),
  };
}

// ─── Universal ────────────────────────────────────────────────────────────

function generateUniversalContext(a: ProjectAnalysis, task?: string): ContextFile {
  const lines = [
    "# README-AGENT.md",
    "",
    "> Genere par Orizon — " + new Date().toISOString().slice(0, 10),
    "",
    "Ce fichier fournit le contexte necessaire a n'importe quel agent de codage",
    "(Pi, Claude Code, Aider, Cursor, Continue.dev, Cline, etc.) pour travailler",
    "sur le projet **" + a.name + "**.",
    "",
    task ? "## Mission\n" + task + "\n" : "",
    "## 1. Vue d'ensemble",
    ...stackLines(a),
    "",
    "## 2. Statistiques",
    "- Fichiers : " + a.stats.totalFiles,
    "- Lignes : " + a.stats.totalLines,
    "- Dossiers : " + a.stats.totalDirs,
    "- Tests : " + a.stats.testFiles + " fichiers",
    "",
    "## 3. Architecture (modules)",
    ...moduleLines(a),
    "",
    "## 4. Points d'entree",
    ...entryPointLines(a),
    "",
    "## 5. Routes API",
    ...apiLines(a),
    "",
    "## 6. Modeles de donnees",
    ...dataModelLines(a),
    "",
    "## 7. Dependances",
    ...depLines(a),
    "",
    "## 8. Tests",
    ...testLines(a),
    "",
    "## 9. Fichiers de configuration",
    ...a.configFiles.map((c) => "- " + c.name + " (" + c.lines + " lignes)"),
    "",
    "## 10. Instructions generales pour l'agent",
    "1. Lisez ORIZON-ANALYSIS.md pour l'analyse complete du projet source.",
    "2. Lisez PROJECT_STRUCTURE.md pour la structure cible.",
    "3. Explorez l'arborescence avant de lire des fichiers individuels.",
    "4. Respectez les conventions de code existantes.",
    "5. Repondez en francais sauf indication contraire.",
    "6. Verifiez que le projet compile apres chaque modification.",
    "",
  ];

  return {
    filename: "README-AGENT.md",
    description: "Contexte universel pour n'importe quel agent de codage",
    target: "universal",
    content: lines.join("\n"),
  };
}