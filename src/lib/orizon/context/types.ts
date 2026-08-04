// =========================================================================
// Orizon — Context Generator types
// =========================================================================

export type ContextTarget =
  | "pi"
  | "claude-code"
  | "aider"
  | "cursor"
  | "continue"
  | "universal";

export interface ContextFile {
  filename: string;
  description: string;
  target: ContextTarget;
  content: string;
}

export interface ContextGenerationOptions {
  /** Description de la mission/tâche pour l'agent */
  task?: string;
  /** Seulement certains agents (par défaut: tous) */
  targets?: ContextTarget[];
}