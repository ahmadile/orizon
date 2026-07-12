// =========================================================================
// ZCode — Open-source integrations catalog
// Research-driven: each entry is a real, current open-source project that
// ZCode can integrate to power a specific phase of the journey.
// =========================================================================

export interface OSSIntegration {
  id: string;
  name: string;
  /** homepage or repo URL */
  url: string;
  /** one-line role */
  role: string;
  /** why it fits ZCode */
  rationale: string;
  /** which phase it powers */
  phase: "comprehension" | "intention" | "experimentation" | "maquette" | "generation" | "global";
  /** license (SPDX-ish) */
  license: string;
  /** language / runtime */
  lang: string;
  /** maturity stars (k) */
  stars: string;
}

export const OSS_INTEGRATIONS: OSSIntegration[] = [
  // --- Phase 1: Comprehension ---
  {
    id: "tree-sitter",
    name: "tree-sitter",
    url: "https://tree-sitter.github.io",
    role: "Parsing AST multi-langage",
    rationale:
      "Génère un AST concret pour 40+ langages avec récupération d'erreur. Indispensable pour l'analyse sémantique du code : chaque fichier est parsé en une arborescence de nœuds typés, ce qui permet à l'IA de comprendre la structure plutôt que de deviner à partir du texte brut.",
    phase: "comprehension",
    license: "MIT",
    lang: "C / WASM bindings",
    stars: "20k+",
  },
  {
    id: "ast-grep",
    name: "ast-grep",
    url: "https://ast-grep.github.io",
    role: "Recherche structurelle de code",
    rationale:
      "grep conscient de la syntaxe : on écrit un pattern comme code, il matche les nœuds AST équivalents. Idéal pour trouver toutes les fonctions d'API, tous les handlers d'événements, ou toutes les configs critiques dans le dépôt — sans faux positifs liés au nommage.",
    phase: "comprehension",
    license: "MIT",
    lang: "Rust",
    stars: "8k+",
  },
  {
    id: "repomix",
    name: "Repomix",
    url: "https://repomix.com",
    role: "Packager le dépôt pour l'IA",
    rationale:
      "Compresse tout le dépôt en un seul fichier AI-friendly (avec structure, fichiers pertinents, ignore des node_modules). C'est le pont entre le filesystem local et le contexte du LLM : on l'utilise pour nourrir l'orchestrateur multi-agents en Phase 1.",
    phase: "comprehension",
    license: "MIT",
    lang: "TypeScript / Node",
    stars: "12k+",
  },
  {
    id: "ripgrep",
    name: "ripgrep (rg)",
    url: "https://github.com/BurntSushi/ripgrep",
    role: "Recherche rapide de code",
    rationale:
      "Le plus rapide des grep (SIMD, parallèle). Pour les très gros dépôts, on l'utilise en première passe pour localiser les fichiers pertinents avant de les parser avec tree-sitter. Respecte les .gitignore nativement.",
    phase: "comprehension",
    license: "MIT / Unlicense",
    lang: "Rust",
    stars: "50k+",
  },
  {
    id: "gitlog",
    name: "git log + blame",
    url: "https://git-scm.com",
    role: "Histoire et décisions du projet",
    rationale:
      "Les messages de commit racontent l'évolution du projet : pourquoi tel choix, quelle feature a été ajoutée puis revertée, qui maintient quoi. On parse les 500 derniers commits pour reconstruire l'historique des décisions (V2 feature).",
    phase: "comprehension",
    license: "GPL-2.0",
    lang: "C",
    stars: "—",
  },
  {
    id: "repowise",
    name: "repowise",
    url: "https://repowise.dev",
    role: "Bus factor & couplage caché",
    rationale:
      "Construit un graphe de dépendances à partir de git blame : identifie les fichiers écrits par une seule personne (bus factor), les zones de couplage caché, les fichiers qui changent toujours ensemble. Indispensable pour la Phase 1 sur les gros dépôts.",
    phase: "comprehension",
    license: "MIT",
    lang: "TypeScript",
    stars: "—",
  },

  // --- Phase 2: Intention ---
  {
    id: "ai-skills",
    name: "Agent Skills",
    url: "https://agentskills.io",
    role: "Format ouvert de skills IA",
    rationale:
      "Format standardisé pour packager des capacités IA : instructions + métadonnées + ressources optionnelles (scripts, données). ZCode l'adopte comme format natif pour ses skills — l'utilisateur peut importer un skill existant ou en créer un pour orienter l'intention.",
    phase: "intention",
    license: "MIT",
    lang: "Markdown / YAML",
    stars: "—",
  },
  {
    id: "leak-detector",
    name: "gitleaks",
    url: "https://github.com/gitleaks/gitleaks",
    role: "Détection de secrets exposés",
    rationale:
      "Avant toute analyse, scanne le dépôt pour détecter clés API, tokens, credentials. Évite qu'un secret finisse dans le contexte du LLM (et donc potentiellement loggé). À exécuter systématiquement en Phase 1, avant l'envoi au modèle.",
    phase: "comprehension",
    license: "MIT",
    lang: "Go",
    stars: "18k+",
  },

  // --- Phase 3: Experimentation ---
  {
    id: "aider",
    name: "Aider",
    url: "https://aider.chat",
    role: "Pair-programming IA en CLI",
    rationale:
      "Le meilleur référence pour l'itération code IA : edits diff transparents, git auto-commit, undo propre. En Phase 3, on peut lancer Aider en dry-run sur une piste pour estimer le blast radius (nombre de fichiers touchés) avant de s'engager.",
    phase: "experimentation",
    license: "Apache-2.0",
    lang: "Python",
    stars: "20k+",
  },

  // --- Phase 4: Maquette ---
  {
    id: "ladle",
    name: "Ladle",
    url: "https://ladle.dev",
    role: "Atelier composants React",
    rationale:
      "Alternative légère à Storybook, basée sur Vite. Pour la Phase 4, ZCode génère des stories Ladle pour chaque variant de maquette — l'utilisateur peut les voir en isolation, ajuster les props, et valider l'UX avant la génération finale.",
    phase: "maquette",
    license: "MIT",
    lang: "TypeScript",
    stars: "2.5k+",
  },
  {
    id: "storybook",
    name: "Storybook",
    url: "https://storybook.js.org",
    role: "Atelier composants (référence)",
    rationale:
      "Le standard de l'industrie pour le développement de composants en isolation. Si le projet cible utilise déjà Storybook, on génère les maquettes au format stories.mdx natif. Sinon, on propose Ladle (plus léger).",
    phase: "maquette",
    license: "MIT",
    lang: "TypeScript",
    stars: "85k+",
  },
  {
    id: "html2design-tokens",
    name: "style-dictionary",
    url: "https://amzn.github.io/style-dictionary",
    role: "Export design tokens",
    rationale:
      "Transforme les couleurs / typographies / espacements d'une maquette en tokens réutilisables (JSON, CSS variables, Tailwind config). Feature V2 mais prévue : export de la maquette en design tokens prêts à brancher dans le vrai code.",
    phase: "maquette",
    license: "Apache-2.0",
    lang: "JavaScript",
    stars: "3.2k+",
  },

  // --- Phase 5: Generation ---
  {
    id: "continue",
    name: "Continue.dev",
    url: "https://continue.dev",
    role: "Agent de code (VS Code / JetBrains)",
    rationale:
      "Acquis par Cursor, c'est l'agent de code open source de référence. ZCode génère le PROJECT_STRUCTURE.md + un config.yaml Continue pour que l'utilisateur puisse ouvrir Continue et démarrer la génération sans recopier le contexte.",
    phase: "generation",
    license: "Apache-2.0",
    lang: "TypeScript",
    stars: "24k+",
  },
  {
    id: "openagents",
    name: "OpenAI Agents SDK",
    url: "https://github.com/openai/openai-agents-python",
    role: "Framework multi-agents",
    rationale:
      "Framework léger pour orchestrer plusieurs agents IA avec handoffs, guardrails et tools. ZCode peut l'utiliser en backend pour orchestrer les agents de compréhension (un par partie séquencée), d'où le terme « orchestration multi-agents » du produit.",
    phase: "global",
    license: "MIT",
    lang: "Python",
    stars: "27k+",
  },
];

// =========================================================================
// ZCode — Skills catalog
// Skills = capabilities the AI agent can activate per phase / per intent.
// Format inspired by Agent Skills (agentskills.io) — markdown + metadata.
// =========================================================================

export interface ZCodeSkill {
  id: string;
  name: string;
  description: string;
  /** which phase(s) it applies to */
  phases: string[];
  /** tags for filtering */
  tags: string[];
  /** whether it's currently "active" in the mock session */
  active?: boolean;
  /** icon name from lucide */
  icon: string;
  /** which OSS integration powers it (or null for a native skill) */
  poweredBy?: string;
}

export const ZCODE_SKILLS: ZCodeSkill[] = [
  {
    id: "ast-walk",
    name: "AST Walk",
    description:
      "Parse chaque fichier en arbre syntaxique (tree-sitter) et extrait fonctions, classes, imports, appels d'API. Permet de répondre « montre-moi toutes les routes / tous les handlers / tous les exports ».",
    phases: ["comprehension"],
    tags: ["analyse", "structure", "tree-sitter"],
    active: true,
    icon: "FileCode2",
    poweredBy: "tree-sitter",
  },
  {
    id: "pattern-search",
    name: "Pattern Search",
    description:
      "Recherche structurelle avec ast-grep : trouve tous les nœuds AST correspondant à un pattern (ex. tous les useEffect avec fetch, tous les try/catch qui swallow l'erreur).",
    phases: ["comprehension", "experimentation"],
    tags: ["recherche", "ast-grep"],
    active: true,
    icon: "Search",
    poweredBy: "ast-grep",
  },
  {
    id: "repo-pack",
    name: "Repo Pack",
    description:
      "Compresse le dépôt en un format AI-friendly (Repomix) avec respect des .gitignore et sélection des fichiers pertinents. Nourrit le contexte du LLM sans dépasser le token budget.",
    phases: ["comprehension"],
    tags: ["contexte", "repomix"],
    active: true,
    icon: "Package",
    poweredBy: "repomix",
  },
  {
    id: "secret-scan",
    name: "Secret Scan",
    description:
      "Scanne le dépôt avec gitleaks avant tout envoi au LLM. Bloque l'analyse si un secret est détecté et propose de l'ignorer ou de le révoquer.",
    phases: ["comprehension"],
    tags: ["sécurité", "gitleaks"],
    active: true,
    icon: "ShieldCheck",
    poweredBy: "leak-detector",
  },
  {
    id: "git-archeology",
    name: "Git Archaeology",
    description:
      "Reconstruit l'historique des décisions : parse les 500 derniers commits, identifie les features ajoutées/revertées, les fichiers qui changent ensemble, le bus factor par module.",
    phases: ["comprehension"],
    tags: ["histoire", "git", "repowise"],
    active: false,
    icon: "GitBranch",
    poweredBy: "repowise",
  },
  {
    id: "blast-radius",
    name: "Blast Radius",
    description:
      "Estime l'impact d'une transformation avant de s'engager : pour une piste donnée, identifie les fichiers à toucher, le nombre de lignes, la complexité cyclomatique. S'appuie sur Aider en dry-run.",
    phases: ["experimentation"],
    tags: ["estimation", "aider"],
    active: false,
    icon: "Bomb",
    poweredBy: "aider",
  },
  {
    id: "mockup-story",
    name: "Mockup Stories",
    description:
      "Génère chaque variante de maquette comme une story Ladle/Storybook isolée, navigable avec des contrôles (couleurs, contenu mocké). L'utilisateur valide l'UX avant la génération.",
    phases: ["maquette"],
    tags: ["maquette", "ladle", "storybook"],
    active: false,
    icon: "LayoutTemplate",
    poweredBy: "ladle",
  },
  {
    id: "token-export",
    name: "Design Tokens Export",
    description:
      "Exporte la maquette validée en design tokens (JSON / CSS variables / Tailwind config) via style-dictionary. Réutilisables directement dans le vrai code généré en Phase 5.",
    phases: ["maquette"],
    tags: ["design", "tokens", "style-dictionary"],
    active: false,
    icon: "Palette",
    poweredBy: "html2design-tokens",
  },
  {
    id: "md-struct",
    name: "MD Structure",
    description:
      "Génère PROJECT_STRUCTURE.md au format standardisé, réutilisable par Continue.dev, Aider, Cursor ou Claude Code. Sections : objectif, stack, arborescence, responsabilités, zones sensibles, critères d'acceptation.",
    phases: ["generation"],
    tags: ["génération", "continue", "aider"],
    active: true,
    icon: "FileCode2",
    poweredBy: "continue",
  },
  {
    id: "explain-level",
    name: "Explain Like I'm",
    description:
      "Adapte le niveau d'explication : débutant, dev d'un autre langage, dev confirmé du langage. Re-prompte le LLM avec le persona choisi pour personnaliser chaque réponse du chat.",
    phases: ["comprehension"],
    tags: ["pédagogie", "persona"],
    active: false,
    icon: "GraduationCap",
  },
  {
    id: "diff-viz",
    name: "Diff Visualizer",
    description:
      "Affiche les diffs en vert (ajouts) / rouge (suppressions) avec navigation par fichier, comme GitHub. Sert en Phase 5 pour montrer ce que l'agent va changer avant de l'appliquer.",
    phases: ["generation"],
    tags: ["diff", "visualisation"],
    active: false,
    icon: "GitCompare",
  },
  {
    id: "multi-agent",
    name: "Multi-Agent Orchestrator",
    description:
      "Orchestre un agent par partie séquencée (frontend, backend, API, config). Chaque agent lit sa zone, produit un résumé, puis un agent coordinateur fusionne. Propulsé par OpenAI Agents SDK.",
    phases: ["comprehension", "global"],
    tags: ["orchestration", "agents"],
    active: true,
    icon: "Network",
    poweredBy: "openagents",
  },
];
