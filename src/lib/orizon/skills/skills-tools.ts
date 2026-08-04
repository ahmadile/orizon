// =========================================================================
// Orizon — Skills to Tools mapping
//
// Maps each ZCodeSkill to the tools the agent can use to accomplish it.
// This allows the agent to know exactly which tools to use for each skill.
// =========================================================================

import { ZCODE_SKILLS } from "@/lib/zcode/oss-catalog";

export interface SkillToolMapping {
  skillId: string;
  skillName: string;
  /** Tools that implement this skill */
  toolNames: string[];
  /** How the agent should use the tools */
  instructions: string;
  /** Whether this skill is active */
  active: boolean;
}

/**
 * Get the list of active skills with their tool mappings.
 * Uses the active flag from the ZCODE_SKILLS catalog.
 */
export function getActiveSkillMappings(): SkillToolMapping[] {
  const allMappings: SkillToolMapping[] = [
    {
      skillId: "ast-walk",
      skillName: "AST Walk",
      toolNames: ["read_file", "project_structure", "list_directory"],
      instructions: "Utilise project_structure pour voir la structure, read_file pour lire les fichiers clés, list_directory pour explorer l'arborescence.",
      active: false,
    },
    {
      skillId: "pattern-search",
      skillName: "Pattern Search",
      toolNames: ["search_code"],
      instructions: "Utilise search_code pour trouver des patterns dans le code (regex, noms de fonctions, imports, etc.).",
      active: false,
    },
    {
      skillId: "repo-pack",
      skillName: "Repo Pack",
      toolNames: ["project_structure", "read_file", "list_directory"],
      instructions: "Utilise project_structure pour avoir une vue d'ensemble, puis lis les fichiers un par un avec read_file.",
      active: false,
    },
    {
      skillId: "secret-scan",
      skillName: "Secret Scan",
      toolNames: ["search_code", "exec_command"],
      instructions: "Utilise search_code pour chercher des patterns suspects (clés API, tokens, mots de passe). Exécute gitleaks via exec_command si disponible.",
      active: false,
    },
    {
      skillId: "md-struct",
      skillName: "MD Structure",
      toolNames: ["project_structure", "read_file"],
      instructions: "Utilise project_structure pour la carte du projet, puis génère un fichier PROJECT_STRUCTURE.md avec write_file.",
      active: false,
    },
    {
      skillId: "multi-agent",
      skillName: "Multi-Agent Orchestrator",
      toolNames: ["exec_command", "read_file", "search_code"],
      instructions: "L'analyse multi-agents est gérée par le backend. Utilise read_file et search_code pour préparer les données d'entrée.",
      active: false,
    },
    {
      skillId: "git-archeology",
      skillName: "Git Archaeology",
      toolNames: ["git_ops", "exec_command"],
      instructions: "Utilise git_ops avec l'opération 'log' pour explorer l'historique git, 'diff' pour voir les changements.",
      active: false,
    },
    {
      skillId: "blast-radius",
      skillName: "Blast Radius",
      toolNames: ["search_code", "read_file", "project_structure"],
      instructions: "Utilise search_code pour trouver les dépendances entre fichiers, project_structure pour mesurer l'impact.",
      active: false,
    },
    {
      skillId: "explain-level",
      skillName: "Explain Like I'm",
      toolNames: [],
      instructions: "Aucun outil spécifique. Adapte ton niveau d'explication au niveau de l'utilisateur (débutant, intermédiaire, expert).",
      active: false,
    },
    {
      skillId: "diff-viz",
      skillName: "Diff Visualizer",
      toolNames: ["git_ops", "exec_command"],
      instructions: "Utilise git_ops avec l'opération 'diff' pour voir les changements entre versions.",
      active: false,
    },
  ];

  // Sync active status from ZCODE_SKILLS catalog
  const skillsMap = new Map(ZCODE_SKILLS.map((s) => [s.id, s.active]));
  for (const m of allMappings) {
    const catalogActive = skillsMap.get(m.skillId);
    if (catalogActive !== undefined) {
      m.active = catalogActive;
    }
  }
  return allMappings;
}

/**
 * Build the skills section for the system prompt.
 */
export function buildSkillsSection(): string {
  const activeSkills = getActiveSkillMappings().filter((s) => s.active);

  if (activeSkills.length === 0) return "";

  const lines = [
    "# Capacités (skills IA activées pour cette session)",
    ...activeSkills.map(
      (s) => `- **${s.skillName}** : ${s.instructions}`
    ),
    "",
    "Tu peux activer/désactiver ces skills selon les besoins. Si tu as besoin d'une capacité qui n'est pas listée, demande à l'utilisateur de l'activer dans les paramètres.",
  ];

  return lines.join("\n");
}

/**
 * All skills (active + inactive) for reference.
 */
export function getAllSkillsSection(): string {
  const all = getActiveSkillMappings();
  const lines = [
    "# Skills disponibles",
    ...all.map(
      (s) => `- ${s.active ? "✅" : "⬜"} **${s.skillName}** : ${s.instructions}`
    ),
  ];
  return lines.join("\n");
}