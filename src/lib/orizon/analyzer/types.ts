// =========================================================================
// Orizon — Project Analyzer types
// =========================================================================

/**
 * Full project analysis report.
 */
export interface ProjectAnalysis {
  // Métadonnées
  name: string;
  path: string;
  analyzedAt: string;

  // Carte technique
  stack: StackInfo;
  stats: ProjectStats;

  // Structure du projet
  modules: ModuleInfo[];
  fileTree: string; // arbre textuel

  // Dépendances
  dependencies: DepInfo[];

  // Surfaces techniques
  entryPoints: string[];
  apiRoutes: string[];
  dataModels: string[];
  testPatterns: string[];
  configFiles: ConfigFile[];

  // Analyse sémantique (agentique, optionnelle)
  semantic?: SemanticAnalysis;

  // Fichiers de contexte générés (pour d'autres agents)
  contextFiles: ContextFile[];

  // Suggestions de fork/réutilisation
  reuseSuggestions: ReuseSuggestion[];
}

export interface StackInfo {
  primaryLanguage: string;
  languages: { name: string; pct: number }[];
  frameworks: string[];
  packageManager: string | null;
  runtime: string | null;
}

export interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  totalDirs: number;
  testFiles: number;
  testLines: number;
  docFiles: number;
  configFiles: number;
}

export interface ModuleInfo {
  name: string;
  path: string;
  kind: "app" | "lib" | "api" | "db" | "config" | "test" | "docs" | "scripts" | "assets" | "other";
  description: string;
  keyFiles: string[];
  fileCount: number;
  lines: number;
  /** Potentiellement réutilisable */
  isReusable: boolean;
  /** Pourquoi c'est réutilisable */
  reuseRationale?: string;
}

export interface DepInfo {
  name: string;
  version: string;
  kind: "runtime" | "dev" | "external";
  role: string;
  /** Si cette dépendance peut être extraite pour un autre projet */
  isReusable: boolean;
}

export interface ConfigFile {
  path: string;
  name: string;
  content: string;
  lines: number;
}

export interface SemanticAnalysis {
  architecture: string;
  modulesDescription: { name: string; responsibility: string; keyTechnologies: string[] }[];
  dataFlow: string;
  patterns: { name: string; description: string; location: string }[];
  sensitiveAreas: { name: string; risk: string; recommendation: string }[];
  reusableParts: { name: string; whatItDoes: string; howToUse: string; effort: "low" | "medium" | "high" }[];
  risks: string[];
  forkStrategy: string;
}

export interface ContextFile {
  filename: string;
  description: string;
  content: string;
  /** Pour quel agent : "pi" | "claude-code" | "aider" | "cursor" | "all" */
  target: "pi" | "claude-code" | "aider" | "cursor" | "all";
}

export interface ReuseSuggestion {
  title: string;
  description: string;
  modules: string[];
  effort: "low" | "medium" | "high";
  contextFile: string; // nom du fichier de contexte à utiliser
}