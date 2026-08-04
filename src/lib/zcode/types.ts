// =========================================================================
// ZCode — Domain types
// =========================================================================

export type PhaseId =
  | "comprehension"
  | "intention"
  | "experimentation"
  | "maquette"
  | "generation";

export interface Phase {
  id: PhaseId;
  label: string;
  shortLabel: string;
  description: string;
}

export type StepStatus = "pending" | "running" | "completed" | "error";

export interface ComprehensionStep {
  id: string;
  label: string;
  detail: string;
  status: StepStatus;
  /** ms it takes to "run" this step in the simulated comprehension flow */
  durationMs: number;
}

export type PartKind =
  | "frontend"
  | "backend"
  | "api"
  | "config"
  | "deps"
  | "tests"
  | "docs";

export interface RepoPart {
  id: string;
  kind: PartKind;
  name: string;
  description: string;
  files: number;
  lines: number;
  technologies: string[];
  /** representative file paths */
  sampleFiles: string[];
}

export interface RepoSummary {
  name: string;
  path: string;
  description: string;
  primaryLanguage: string;
  languages: { name: string; pct: number }[];
  stars: number;
  forks: number;
  lastCommit: string;
  totalFiles: number;
  totalLines: number;
  parts: RepoPart[];
  dependencies: { name: string; version: string; role: string }[];
  features: string[];
  architecture: string;
}

export type MessageRole = "user" | "assistant" | "system";

export interface CodeBlock {
  language: string;
  filename?: string;
  code: string;
}

export interface Attachment {
  id: string;
  name: string;
  kind: "file" | "folder" | "image";
  size?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  codeBlocks?: CodeBlock[];
  /** referenced repo part id, for "show me the code" answers */
  refPartId?: string;
  /** is the assistant currently "typing" this message */
  streaming?: boolean;
  /** optional chain-of-thought shown as a subtle aside while streaming */
  reasoning?: string;
  /** error flag if the API call failed */
  error?: boolean;
  /** tool calls executed by the agent (displayed as chips) */
  toolCalls?: { name: string; status: "running" | "done" | "error" }[];
}

export type Intent = "improve" | "derive" | "adapt" | null;

export interface Conversation {
  id: string;
  title: string;
  repoPath: string;
  repoName: string;
  phase: PhaseId;
  intent: Intent;
  lastActivity: number;
  unread?: boolean;
  active?: boolean;
}

export interface MockupVariant {
  id: string;
  label: string;
  html: string;
  description: string;
}
