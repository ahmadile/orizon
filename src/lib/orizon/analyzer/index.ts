// =========================================================================
// Orizon — Project Analyzer
//
// Combines static analysis (deterministic, fast) with optional agentic
// analysis (LLM-based, semantic) to produce a comprehensive project report.
// =========================================================================

import { analyzeProject as staticAnalyze } from "./static-analyzer";
import type { ProjectAnalysis, ContextFile, ReuseSuggestion, SemanticAnalysis } from "./types";

export * from "./types";

/**
 * Analyze a project at the given path.
 * Always runs static analysis first (fast, no LLM needed).
 * If a provider is configured, also runs agentic analysis for deep semantics.
 */
export async function analyzeProject(
  projectPath: string,
  opts?: {
    agentic?: boolean;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }
): Promise<ProjectAnalysis> {
  // Phase 1: Static analysis (always runs)
  const partial = await staticAnalyze(projectPath);

  const base: ProjectAnalysis = {
    name: partial.name ?? path.basename(projectPath),
    path: projectPath,
    analyzedAt: partial.analyzedAt ?? new Date().toISOString(),
    stack: partial.stack ?? { primaryLanguage: "Inconnu", languages: [], frameworks: [], packageManager: null, runtime: null },
    stats: partial.stats ?? { totalFiles: 0, totalLines: 0, totalDirs: 0, testFiles: 0, testLines: 0, docFiles: 0, configFiles: 0 },
    modules: partial.modules ?? [],
    fileTree: partial.fileTree ?? "",
    dependencies: partial.dependencies ?? [],
    entryPoints: partial.entryPoints ?? [],
    apiRoutes: partial.apiRoutes ?? [],
    dataModels: partial.dataModels ?? [],
    testPatterns: partial.testPatterns ?? [],
    configFiles: partial.configFiles ?? [],
    contextFiles: [],
    reuseSuggestions: [],
  };

  // Phase 2: Generate context files (always, doesn't need LLM)
  base.contextFiles = generateContextFiles(base);
  base.reuseSuggestions = generateReuseSuggestions(base);

  // Phase 3: Agentic analysis (optional, needs LLM)
  if (opts?.agentic && opts?.apiKey) {
    try {
      base.semantic = await runAgenticAnalysis(base, {
        apiKey: opts.apiKey ?? "",
        baseUrl: opts.baseUrl ?? "https://api.openai.com/v1",
        model: opts.model ?? "gpt-4o-mini",
      });
    } catch (err) {
      console.error("Agentic analysis failed:", err);
      // Graceful degradation — static analysis is still available
    }
  }

  return base;
}

import path from "node:path";

// ─── Context file generation ──────────────────────────────────────────────

function generateContextFiles(analysis: ProjectAnalysis): ContextFile[] {
  return [
    generateOrizonContext(analysis),
    generatePiContext(analysis),
    generateClaudeCodeContext(analysis),
  ].filter(Boolean) as ContextFile[];
}

function generateOrizonContext(analysis: ProjectAnalysis): ContextFile {
  return {
    filename: "ORIZON-ANALYSIS.md",
    description: "Rapport d'analyse complet Orizon — utilisable en entrée des phases suivantes",
    target: "all",
    content: buildOrizonContextContent(analysis),
  };
}

function generatePiContext(analysis: ProjectAnalysis): ContextFile {
  return {
    filename: "CONTEXT-PI.md",
    description: "Contexte formaté pour Pi (agent coding) — instructions pour travailler sur ce projet",
    target: "pi",
    content: buildPiContextContent(analysis),
  };
}

function generateClaudeCodeContext(analysis: ProjectAnalysis): ContextFile {
  return {
    filename: "CONTEXT-CLAUDE.md",
    description: "Contexte formaté pour Claude Code — instructions pour travailler sur ce projet",
    target: "claude-code",
    content: buildClaudeContextContent(analysis),
  };
}

function buildOrizonContextContent(a: ProjectAnalysis): string {
  const lines = [
    "# Analyse Orizon — " + a.name,
    "",
    "## Stack",
    "- Langage principal : " + a.stack.primaryLanguage,
    "- Frameworks : " + a.stack.frameworks.join(", "),
    "- Runtime : " + (a.stack.runtime ?? "N/A"),
    "- Package manager : " + (a.stack.packageManager ?? "N/A"),
    "",
    "## Statistiques",
    "- Fichiers : " + a.stats.totalFiles,
    "- Lignes : " + a.stats.totalLines,
    "- Tests : " + a.stats.testFiles + " fichiers (" + a.stats.testLines + " lignes)",
    "- Documentation : " + a.stats.docFiles + " fichiers",
    "",
    "## Modules",
    ...a.modules.map((m) => {
      let line = "- **" + m.name + "** (" + m.kind + ") — " + m.description + " [" + m.fileCount + " fichiers, " + m.lines + " lignes]";
      if (m.isReusable) line += " (reutilisable)";
      return line;
    }),
    "",
    "## Points d'entree",
    ...(a.entryPoints.length ? a.entryPoints.map((e) => "- " + e) : ["Aucun detecte"]),
    "",
    "## Routes API",
    ...(a.apiRoutes.length ? a.apiRoutes.map((r) => "- " + r) : ["Aucune detectee"]),
    "",
    "## Modeles de donnees",
    ...(a.dataModels.length ? a.dataModels.map((m) => "- " + m) : ["Aucun detecte"]),
    "",
    "## Dependances (" + a.dependencies.length + ")",
    ...a.dependencies.slice(0, 20).map((d) => {
      let line = "- " + d.name + " " + d.version + " — " + d.role;
      if (d.isReusable) line += " (reutilisable)";
      return line;
    }),
    "",
    "## Arborescence",
    "```",
    a.fileTree.slice(0, 2000),
    "```",
  ];
  return lines.join("\n");
}

function buildPiContextContent(a: ProjectAnalysis): string {
  const lines = [
    "# Contexte projet pour Pi — " + a.name,
    "",
    "Ce fichier permet à Pi de comprendre le projet et de travailler dessus.",
    "",
    "## Résumé",
    "Projet " + a.stack.primaryLanguage + " utilisant " + a.stack.frameworks.join(", ") + ".",
    a.stats.totalFiles + " fichiers, " + a.stats.totalLines + " lignes de code.",
    "",
    "## Structure",
    ...a.modules.map((m) => "- " + m.path + ": " + m.description + " (" + m.fileCount + " fichiers)"),
    "",
    "## Dépendances principales",
    ...a.dependencies.filter((d) => d.kind === "runtime").slice(0, 10).map((d) => "- " + d.name + "@" + d.version + ": " + d.role),
    "",
    "## Fichiers clés",
    ...a.entryPoints.map((e) => "- " + e),
    ...a.configFiles.map((c) => "- " + c.name),
    "",
    "## Instructions pour Pi",
    "Tu travailles sur le projet " + a.name + ". Utilise les outils read_file, search_code, exec_command pour explorer le code et write_file pour le modifier. Réponds en francais.",
  ];
  return lines.join("\n");
}

function buildClaudeContextContent(a: ProjectAnalysis): string {
  const lines = [
    "# Contexte projet pour Claude Code — " + a.name,
    "",
    "## Stack",
    "- " + a.stack.primaryLanguage,
    ...a.stack.frameworks.map((f) => "- " + f),
    "- " + (a.stack.runtime ?? "N/A"),
    "",
    "## Arborescence",
    a.fileTree.slice(0, 1000),
    "",
    "## Regles",
    "1. Lis toujours les fichiers avant de les modifier",
    "2. Verifie les dependances avant d'en ajouter",
    "3. Maintiens la couverture de tests existante",
    "4. Reponds en francais",
  ];
  return lines.join("\n");
}

// ─── Reuse suggestions ────────────────────────────────────────────────────

function generateReuseSuggestions(analysis: ProjectAnalysis): ReuseSuggestion[] {
  const suggestions: ReuseSuggestion[] = [];

  // Suggest reusable modules
  for (const mod of analysis.modules.filter((m) => m.isReusable)) {
    suggestions.push({
      title: `Module ${mod.name}`,
      description: mod.reuseRationale ?? `Module ${mod.name} potentiellement réutilisable`,
      modules: [mod.name],
      effort: mod.fileCount > 10 ? "medium" : "low",
      contextFile: "ORIZON-ANALYSIS.md",
    });
  }

  // Suggest reusable dependencies
  const reusableDeps = analysis.dependencies.filter((d) => d.isReusable);
  if (reusableDeps.length > 0) {
    suggestions.push({
      title: "Dépendances réutilisables",
      description: `Ces dépendances sont génériques et réutilisables : ${reusableDeps.map((d) => d.name).join(", ")}`,
      modules: [],
      effort: "low",
      contextFile: "ORIZON-ANALYSIS.md",
    });
  }

  // Suggest API extraction
  if (analysis.apiRoutes.length > 0) {
    suggestions.push({
      title: "API existante",
      description: `${analysis.apiRoutes.length} routes API détectées — peuvent être extraites dans un service indépendant`,
      modules: ["api"],
      effort: "medium",
      contextFile: "CONTEXT-PI.md",
    });
  }

  return suggestions.slice(0, 5);
}

// ─── Agentic analysis (optional) ──────────────────────────────────────────

async function runAgenticAnalysis(
  analysis: ProjectAnalysis,
  opts: { apiKey: string; baseUrl: string; model: string }
): Promise<SemanticAnalysis> {
  // Build a prompt for the LLM that includes the static analysis results
  const prompt = `Tu es un architecte logiciel expert. Analyse le projet suivant et produit un rapport structuré.

## Contexte du projet
Nom: ${analysis.name}
Stack: ${analysis.stack.primaryLanguage} / ${analysis.stack.frameworks.join(", ")}
Modules: ${analysis.modules.map((m) => `${m.name} (${m.kind}): ${m.description}`).join(" | ")}
Fichiers: ${analysis.stats.totalFiles}, Lignes: ${analysis.stats.totalLines}
Dépendances: ${analysis.dependencies.length}
Routes API: ${analysis.apiRoutes.length}
Modèles de données: ${analysis.dataModels.length}

## Structure
${analysis.fileTree.slice(0, 1500)}

## Tâche
Produis une analyse au format JSON suivant (réponds UNIQUEMENT avec le JSON, pas de texte autour) :
{
  "architecture": "description de l'architecture en 3-5 phrases",
  "modulesDescription": [{"name": "nom", "responsibility": "rôle", "keyTechnologies": ["tech1", "tech2"]}],
  "dataFlow": "description du flux de données en 2-3 phrases",
  "patterns": [{"name": "nom", "description": "description", "location": "où"}],
  "sensitiveAreas": [{"name": "zone", "risk": "risque", "recommendation": "recommandation"}],
  "reusableParts": [{"name": "partie", "whatItDoes": "ce qu'elle fait", "howToUse": "comment l'utiliser ailleurs", "effort": "low|medium|high"}],
  "risks": ["risque1", "risque2"],
  "forkStrategy": "stratégie de fork en 2-3 phrases"
}`;

  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: "Tu es un architecte logiciel expert. Tu réponds UNIQUEMENT en JSON valide, sans texte autour." },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    throw new Error(`Agentic analysis failed: ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";

  // Try to parse JSON from the response
  try {
    // Find JSON in the response (it might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch {
    // Fallback: return basic structure
    return {
      architecture: "Analyse non disponible (erreur de parsing)",
      modulesDescription: analysis.modules.map((m) => ({
        name: m.name,
        responsibility: m.description,
        keyTechnologies: analysis.stack.frameworks,
      })),
      dataFlow: "Non disponible",
      patterns: [],
      sensitiveAreas: [],
      reusableParts: analysis.modules.filter((m) => m.isReusable).map((m) => ({
        name: m.name,
        whatItDoes: m.description,
        howToUse: `Réutiliser le dossier ${m.path}`,
        effort: m.fileCount > 10 ? "medium" as const : "low" as const,
      })),
      risks: [],
      forkStrategy: "Analyse non disponible",
    };
  }
}