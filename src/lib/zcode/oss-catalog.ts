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

  // --- New integrations (user-provided projects) ---

  // Comprehension / context compression
  {
    id: "headroom",
    name: "Headroom",
    url: "https://github.com/headroomlabs-ai/headroom",
    role: "Compression de contexte pour LLM",
    rationale:
      "Compresse tout ce que l'IA lit — sorties d'outils, logs, chunks RAG, fichiers, historique — avant que ça n'atteigne le LLM. Pour ZCode, c'est critique sur les gros dépôts : on compresse les fichiers parsés par tree-sitter avant de les envoyer à l'orchestrateur, ce qui réduit le coût token et permet d'analyser des dépôts plus grands.",
    phase: "comprehension",
    license: "MIT",
    lang: "TypeScript",
    stars: "58k+",
  },

  // Security — skills scanner
  {
    id: "skillspector",
    name: "SkillSpector",
    url: "https://github.com/nvidia/skillspector",
    role: "Scanner de sécurité pour skills IA",
    rationale:
      "Scanner de sécurité développé par NVIDIA pour détecter les vulnérabilités, patterns malveillants et risques de politique dans les skills IA. ZCode l'utilise pour scanner chaque skill avant activation — un skill peut contenir des instructions malveillantes (prompt injection, exfiltration de données), SkillSpector bloque ça avant l'installation.",
    phase: "intention",
    license: "Apache-2.0",
    lang: "Python",
    stars: "1k+",
  },

  // Browser automation — project preview & visual testing
  {
    id: "browser-use",
    name: "Browser Use",
    url: "https://github.com/browser-use/browser-use",
    role: "Automatisation navigateur pour IA",
    rationale:
      "Permet à l'IA d'utiliser un navigateur comme un humain : ouvrir des pages, cliquer, remplir des formulaires. Pour ZCode : (1) en Phase 4 (maquette), l'IA peut ouvrir la maquette HTML dans un vrai navigateur et prendre des screenshots pour valider le rendu ; (2) en Phase 5 (génération), l'IA peut naviguer sur le projet généré pour vérifier qu'il marche.",
    phase: "maquette",
    license: "MIT",
    lang: "Python",
    stars: "55k+",
  },

  // Web scraping — documentation & dependency research
  {
    id: "firecrawl",
    name: "Firecrawl",
    url: "https://github.com/firecrawl/firecrawl",
    role: "Scraping web → Markdown pour LLM",
    rationale:
      "Convertit n'importe quelle page web en Markdown propre, structuré, prêt pour le LLM. Pour ZCode : quand l'utilisateur demande « à quoi sert cette dépendance ? », Firecrawl va chercher la doc officielle (npmjs.com, pypi.org, docs du framework) et la transforme en contexte utilisable par l'IA. Aussi utile pour analyser le README d'un dépôt GitHub distant.",
    phase: "comprehension",
    license: "AGPL-3.0",
    lang: "TypeScript",
    stars: "30k+",
  },

  // Generation workflow — methodology
  {
    id: "gstack",
    name: "gstack",
    url: "https://github.com/garrytan/gstack",
    role: "Methodologie de développement IA",
    rationale:
      "Le setup Claude Code de Garry Tan (Y Combinator) — un workflow structuré où chaque étape du développement a son mode cognitif propre. ZCode s'en inspire pour structurer la Phase 5 : au lieu de générer tout d'un coup, on suit un workflow gstack-like (plan → test → implémente → review) qui donne à l'agent un cadre discipliné.",
    phase: "generation",
    license: "MIT",
    lang: "TypeScript",
    stars: "5k+",
  },

  // Skills framework — composable TDD skills
  {
    id: "superpowers",
    name: "Superpowers",
    url: "https://github.com/obra/superpowers",
    role: "Framework de skills composable (TDD)",
    rationale:
      "Framework de skills IA basé sur le TDD appliqué à la documentation de processus. Chaque skill est testable et composable. ZCode l'adopte comme format de skill avancé : au lieu de skills statiques (markdown), on peut écrire des skills avec tests intégrés qui valident que la skill produit bien le résultat attendu.",
    phase: "intention",
    license: "MIT",
    lang: "TypeScript",
    stars: "10k+",
  },

  // Prompt quality — red teaming & evals
  {
    id: "promptfoo",
    name: "Promptfoo",
    url: "https://github.com/promptfoo/promptfoo",
    role: "Tests & red teaming de prompts",
    rationale:
      "Teste les prompts et modèles avec des évaluations automatisées + red teaming (simulation d'attaques adversariales). Pour ZCode : valide le system prompt de l'orchestrateur avant déploiement, vérifie que l'IA ne divulgue pas de secrets, teste la robustesse face à des questions pièges. Indispensable pour la qualité en production.",
    phase: "global",
    license: "MIT",
    lang: "TypeScript",
    stars: "5k+",
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

  // --- New skills (user-provided projects) ---

  {
    id: "context-compress",
    name: "Context Compressor",
    description:
      "Compresse les fichiers parsés et l'historique avant envoi au LLM (Headroom). Permet d'analyser des gros dépôts sans exploser le token budget — critique pour les monorepos.",
    phases: ["comprehension"],
    tags: ["contexte", "headroom", "compression"],
    active: false,
    icon: "Minimize2",
    poweredBy: "headroom",
  },
  {
    id: "skill-scanner",
    name: "Skill Scanner",
    description:
      "Scanne chaque skill IA avant activation pour détecter prompt injection, exfiltration de données, patterns malveillants (SkillSpector de NVIDIA). Bloque les skills dangereuses.",
    phases: ["intention", "global"],
    tags: ["sécurité", "skillspector", "nvidia"],
    active: true,
    icon: "ShieldAlert",
    poweredBy: "skillspector",
  },
  {
    id: "web-preview",
    name: "Web Preview",
    description:
      "Ouvre la maquette HTML dans un vrai navigateur headless et prend des screenshots pour valider le rendu visuel (Browser Use). Compare les variants de maquette côte à côte.",
    phases: ["maquette"],
    tags: ["navigateur", "browser-use", "screenshot"],
    active: false,
    icon: "Monitor",
    poweredBy: "browser-use",
  },
  {
    id: "doc-fetcher",
    name: "Doc Fetcher",
    description:
      "Récupère la documentation officielle des dépendances (npm, pypi, docs du framework) et la convertit en Markdown pour le LLM (Firecrawl). Répond aux questions « à quoi sert cette lib ? ».",
    phases: ["comprehension"],
    tags: ["documentation", "firecrawl", "scraping"],
    active: false,
    icon: "BookOpen",
    poweredBy: "firecrawl",
  },
  {
    id: "tdd-workflow",
    name: "TDD Workflow",
    description:
      "Workflow de génération structuré : plan → test → implémente → review (inspiré de gstack). Chaque étape a son mode cognitif propre, l'agent ne génère pas tout d'un coup.",
    phases: ["generation"],
    tags: ["workflow", "gstack", "tdd"],
    active: false,
    icon: "ListChecks",
    poweredBy: "gstack",
  },
  {
    id: "skill-tdd",
    name: "Composable Skills",
    description:
      "Skills IA avec tests intégrés qui valident que la skill produit bien le résultat attendu (Superpowers). Chaque skill est testable et composable avec d'autres.",
    phases: ["intention", "global"],
    tags: ["skills", "superpowers", "tdd"],
    active: false,
    icon: "Puzzle",
    poweredBy: "superpowers",
  },
  {
    id: "prompt-redteam",
    name: "Prompt Red Team",
    description:
      "Teste le system prompt de l'orchestrateur avec des attaques adversariales (Promptfoo). Vérifie la robustesse face aux questions pièges et aux tentatives d'extraction de secrets.",
    phases: ["global"],
    tags: ["qualité", "promptfoo", "red-team"],
    active: false,
    icon: "Bug",
    poweredBy: "promptfoo",
  },
];
