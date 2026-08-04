// =========================================================================
// Orizon — Fork engine types
// =========================================================================

export interface ForkOptions {
  /** Chemin absolu du projet source */
  sourcePath: string;
  /** Chemin absolu du nouveau projet fork */
  targetPath: string;
  /** Nom du nouveau projet */
  projectName: string;
  /** Modules à inclure (noms depuis l'analyse) */
  modules?: string[];
  /** Inclure tous les modules réutilisables par défaut */
  includeReusable?: boolean;
  /** Copier les fichiers de configuration (package.json, tsconfig, etc.) */
  includeConfig?: boolean;
  /** Description de l'intention du fork */
  intention?: string;
  /** Initialiser git */
  initGit?: boolean;
  /** Créer un commit initial */
  initialCommit?: boolean;
}

export interface ForkResult {
  success: boolean;
  targetPath: string;
  /** Nombre de fichiers copiés */
  copiedFiles: number;
  /** Modules effectivement copiés */
  copiedModules: string[];
  /** Modules disponibles mais non copiés */
  skippedModules: string[];
  /** Fichiers de configuration copiés */
  configFiles: string[];
  /** Contenu du PROJECT_STRUCTURE.md généré */
  projectStructure: string;
  /** Fichiers de contexte générés */
  contextFiles: string[];
  /** Git initialisé */
  gitInitialized: boolean;
  /** Avertissements */
  warnings: string[];
}

export interface ForkStrategy {
  /** Que faire de chaque module source */
  moduleActions: ModuleAction[];
  /** Fichiers de config à copier/Adapter */
  configActions: ConfigAction[];
  /** Recommandations générales */
  recommendations: string[];
}

export interface ModuleAction {
  moduleName: string;
  action: "keep" | "adapt" | "skip";
  rationale: string;
  /** Pour les modules à adapter, description des changements */
  adaptations?: string[];
}

export interface ConfigAction {
  file: string;
  action: "copy" | "adapt" | "generate" | "skip";
  rationale: string;
  /** Pour les fichiers à adapter, les changements à appliquer */
  changes?: { field: string; newValue: string }[];
}