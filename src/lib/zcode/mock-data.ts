import type {
  Phase,
  ComprehensionStep,
  RepoSummary,
  Conversation,
  Message,
  MockupVariant,
} from "./types";

// =========================================================================
// Phases — the 5-step journey
// =========================================================================
export const PHASES: Phase[] = [
  {
    id: "comprehension",
    label: "Compréhension",
    shortLabel: "Comprendre",
    description:
      "L'orchestration multi-agents analyse le dépôt, séquence le projet et résume technologies, fonctionnalités et architecture.",
  },
  {
    id: "intention",
    label: "Intention",
    shortLabel: "Déclarer",
    description:
      "L'utilisateur déclare son objectif : améliorer le projet, créer un dérivé, ou l'adapter à un usage complètement différent.",
  },
  {
    id: "experimentation",
    label: "Expérimentation",
    shortLabel: "Explorer",
    description:
      "Espace de discussion libre pour explorer les pistes concrètes basées sur l'intention, avant tout engagement de code.",
  },
  {
    id: "maquette",
    label: "Maquette",
    shortLabel: "Maquetter",
    description:
      "Génération d'une coquille visuelle légère HTML/CSS/Tailwind sans backend réel, pour valider la structure et l'UX.",
  },
  {
    id: "generation",
    label: "Génération",
    shortLabel: "Produire",
    description:
      "Production d'un fichier MD de structuration réutilisable, puis génération complète du projet cible par l'agent.",
  },
];

// =========================================================================
// Comprehension steps — the "todo list" shown in the progress panel
// =========================================================================
export const INITIAL_STEPS: ComprehensionStep[] = [
  {
    id: "scan",
    label: "Scan du système de fichiers",
    detail: "Lecture de l'arborescence, filtrage des dossiers ignorés, indexation des fichiers.",
    status: "pending",
    durationMs: 1100,
  },
  {
    id: "detect-stack",
    label: "Détection de la stack technique",
    detail: "Identification des langages, frameworks et runtime via package.json, requirements.txt, etc.",
    status: "pending",
    durationMs: 1300,
  },
  {
    id: "sequence",
    label: "Séquençage du projet",
    detail: "Découpage en couches : frontend / backend / API / config / dépendances / tests.",
    status: "pending",
    durationMs: 1500,
  },
  {
    id: "analyze",
    label: "Analyse sémantique du code",
    detail: "Un agent par partie séquencée lit les fichiers clés et extrait responsabilités et flux.",
    status: "pending",
    durationMs: 1700,
  },
  {
    id: "deps",
    label: "Cartographie des dépendances",
    detail: "Rôle de chaque dépendance externe, risques de sécurité, versions obsolètes.",
    status: "pending",
    durationMs: 1000,
  },
  {
    id: "summarize",
    label: "Synthèse architecturale",
    detail: "Résumé global : fonctionnalités, architecture, points d'entrée, zones sensibles.",
    status: "pending",
    durationMs: 1200,
  },
];

// =========================================================================
// Repository — mock "gomoku-ai" (matches the reference screenshot)
// =========================================================================
export const MOCK_REPO: RepoSummary = {
  name: "gomoku-ai",
  path: "~/projects/gomoku-ai",
  description:
    "Jeu de Gomoku (alignement de cinq) intelligent où le joueur affronte une IA basée sur minimax + élagage alpha-bêta avec heuristique de motifs.",
  primaryLanguage: "TypeScript",
  languages: [
    { name: "TypeScript", pct: 78 },
    { name: "CSS", pct: 14 },
    { name: "HTML", pct: 6 },
    { name: "JSON", pct: 2 },
  ],
  stars: 248,
  forks: 37,
  lastCommit: "il y a 3 jours",
  totalFiles: 42,
  totalLines: 3120,
  architecture:
    "Application monopage (SPA) vanilla TypeScript. Le moteur de jeu (logique + IA) est découplé de la couche de rendu DOM. Aucun framework frontend, aucun backend — le tout tourne côté client.",
  parts: [
    {
      id: "engine",
      kind: "backend",
      name: "Moteur de jeu",
      description:
        "Cœur logique : représentation du plateau, détection des alignements, coups légaux, état de partie. Indépendant du DOM, testable isolément.",
      files: 4,
      lines: 680,
      technologies: ["TypeScript", "Bitboard", "Pattern matching"],
      sampleFiles: ["src/engine/Board.ts", "src/engine/Rules.ts", "src/engine/GameState.ts"],
    },
    {
      id: "ai",
      kind: "backend",
      name: "IA adversaire",
      description:
        "Minimax avec élagage alpha-bêta, profondeur 4, heuristique par motifs (open-3, open-4, capture). Évalue ~12k nœuds par coup en <300ms.",
      files: 3,
      lines: 540,
      technologies: ["Minimax", "Alpha-Beta", "Heuristique motifs", "Web Worker"],
      sampleFiles: ["src/ai/Minimax.ts", "src/ai/Heuristic.ts", "src/ai/worker.ts"],
    },
    {
      id: "ui",
      kind: "frontend",
      name: "Interface joueur",
      description:
        "Rendu du plateau 15×15, gestion des clics, animations de pose de pierre, affichage du tour et du score. Manipulation DOM directe.",
      files: 5,
      lines: 720,
      technologies: ["TypeScript", "DOM API", "CSS Grid", "Canvas (overlay)"],
      sampleFiles: ["src/ui/BoardView.ts", "src/ui/HUD.ts", "src/ui/Animations.ts"],
    },
    {
      id: "api",
      kind: "api",
      name: "Couche de coordination",
      description:
        "Bus d'événements léger entre le moteur, l'IA et l'UI. Aucune API HTTP — c'est un contrat interne typé par des EventMaps.",
      files: 2,
      lines: 180,
      technologies: ["EventEmitter", "Typage strict", "State machine"],
      sampleFiles: ["src/api/EventBus.ts", "src/api/Controller.ts"],
    },
    {
      id: "config",
      kind: "config",
      name: "Configuration & build",
      description:
        "Build Vite, config TypeScript stricte, scripts npm. Aucune variable d'environnement — projet 100% côté client.",
      files: 6,
      lines: 210,
      technologies: ["Vite", "tsconfig strict", "ESLint", "Prettier"],
      sampleFiles: ["vite.config.ts", "tsconfig.json", ".eslintrc.cjs"],
    },
    {
      id: "tests",
      kind: "tests",
      name: "Tests",
      description:
        "Tests unitaires du moteur et de l'IA avec Vitest. Couverture 73% sur la couche logique, 0% sur l'UI.",
      files: 3,
      lines: 410,
      technologies: ["Vitest", "Tests unitaires"],
      sampleFiles: ["tests/Board.test.ts", "tests/Heuristic.test.ts"],
    },
  ],
  dependencies: [
    { name: "vite", version: "^5.4.0", role: "Bundler dev server" },
    { name: "typescript", version: "^5.5.0", role: "Typage statique" },
    { name: "vitest", version: "^2.0.0", role: "Runner de tests" },
    { name: "lucide-icons", version: "^0.460.0", role: "Icônes UI" },
  ],
  features: [
    "Plateau 15×15 avec pose de pierre par clic",
    "IA Minimax profondeur 4 avec alpha-bêta",
    "Détection d'alignements horizontaux, verticaux, diagonaux",
    "Trois niveaux de difficulté (profondeur 2 / 4 / 6)",
    "Annulation du dernier coup (undo)",
    "Mode spectateur : IA vs IA",
  ],
};

// =========================================================================
// Initial conversations for the sidebar
// =========================================================================
const now = Date.now();
export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    title: "gomoku-ai — compréhension initiale",
    repoPath: "~/projects/gomoku-ai",
    repoName: "gomoku-ai",
    phase: "comprehension",
    intent: null,
    lastActivity: now,
    active: true,
  },
  {
    id: "c2",
    title: "chat-app-react — refonte UX",
    repoPath: "~/projects/chat-app-react",
    repoName: "chat-app-react",
    phase: "maquette",
    intent: "improve",
    lastActivity: now - 1000 * 60 * 60 * 5,
  },
  {
    id: "c3",
    title: "weather-cli — dériver en API web",
    repoPath: "~/projects/weather-cli",
    repoName: "weather-cli",
    phase: "generation",
    intent: "derive",
    lastActivity: now - 1000 * 60 * 60 * 26,
  },
  {
    id: "c4",
    title: "blog-static — adapter en e-commerce",
    repoPath: "~/projects/blog-static",
    repoName: "blog-static",
    phase: "experimentation",
    intent: "adapt",
    lastActivity: now - 1000 * 60 * 60 * 48,
  },
];

// =========================================================================
// Initial messages for the active conversation
// =========================================================================
export const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    role: "system",
    content:
      "Dépôt **gomoku-ai** chargé depuis `~/projects/gomoku-ai`. 42 fichiers, 3 120 lignes. Lancement de l'orchestration multi-agents pour la phase de compréhension.",
    timestamp: now - 1000 * 60 * 2,
  },
];

// =========================================================================
// Mockup variants for Phase 4
// =========================================================================
export const MOCKUP_VARIANTS: MockupVariant[] = [
  {
    id: "classic",
    label: "Classique bois",
    description: "Plateau traditionnel fond bois, pierres noires/blanches, sidebar scores.",
    html: `<div style="font-family:system-ui;background:#1a1410;color:#f5e6c8;padding:20px;border-radius:10px;display:grid;grid-template-columns:200px 1fr;gap:16px;min-height:340px">
  <div style="background:#2a1f17;padding:16px;border-radius:8px">
    <div style="font-size:13px;opacity:.7;text-transform:uppercase;letter-spacing:.05em">Tour</div>
    <div style="font-size:28px;font-weight:600;margin:4px 0 16px">Noir</div>
    <div style="font-size:13px;opacity:.7">Joueur</div>
    <div style="font-size:16px;margin-bottom:12px">Vous</div>
    <div style="font-size:13px;opacity:.7">IA</div>
    <div style="font-size:16px">Profondeur 4</div>
    <div style="margin-top:20px;padding:10px;background:#3a2a1f;border-radius:6px;font-size:12px;opacity:.8">Coup 12 · 0 captures</div>
  </div>
  <div style="background:#d9b380;padding:20px;border-radius:8px;display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(9,1fr);gap:0;aspect-ratio:1">
    ${Array.from({ length: 81 }).map((_, i) => {
      const hasStone = [10, 28, 46, 19, 37, 55, 64].includes(i);
      const isBlack = [10, 28, 46, 64].includes(i);
      return `<div style="border:1px solid rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center">${hasStone ? `<div style="width:80%;height:80%;border-radius:50%;background:${isBlack ? "#111" : "#f5f5f5"};box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>` : ""}</div>`;
    }).join("")}
  </div>
</div>`,
  },
  {
    id: "modern",
    label: "Moderne néon",
    description: "Thème sombre, accents néon, plateau grille lumineuse, pierres glow.",
    html: `<div style="font-family:system-ui;background:#0a0a0f;color:#e5e7eb;padding:20px;border-radius:10px;display:grid;grid-template-columns:200px 1fr;gap:16px;min-height:340px">
  <div style="background:#12121a;padding:16px;border-radius:8px;border:1px solid #1f1f2e">
    <div style="font-size:11px;color:#10b981;text-transform:uppercase;letter-spacing:.1em">● Tour</div>
    <div style="font-size:24px;font-weight:600;margin:4px 0 16px;color:#fff">Bleu</div>
    <div style="font-size:12px;opacity:.6">Joueur</div>
    <div style="font-size:15px;margin-bottom:10px">Humain</div>
    <div style="font-size:12px;opacity:.6">IA</div>
    <div style="font-size:15px;color:#10b981">GLM-5.2</div>
    <div style="margin-top:20px;padding:10px;background:#0a0a0f;border:1px solid #1f1f2e;border-radius:6px;font-size:11px;opacity:.7">Coup 12 · 0 captures</div>
  </div>
  <div style="background:#0d0d14;padding:20px;border-radius:8px;border:1px solid #1f1f2e;display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(9,1fr);gap:1px">
    ${Array.from({ length: 81 }).map((_, i) => {
      const hasStone = [10, 28, 46, 19, 37, 55, 64].includes(i);
      const isBlue = [10, 28, 46, 64].includes(i);
      return `<div style="background:#14141f;display:flex;align-items:center;justify-content:center">${hasStone ? `<div style="width:75%;height:75%;border-radius:50%;background:${isBlue ? "#3b82f6" : "#f5f5f5"};box-shadow:0 0 12px ${isBlue ? "#3b82f680" : "#f5f5f580"}"></div>` : ""}</div>`;
    }).join("")}
  </div>
</div>`,
  },
  {
    id: "minimal",
    label: "Minimal mono",
    description: "Noir & blanc pur, typographie éditoriale, pas de décor.",
    html: `<div style="font-family:Georgia,serif;background:#fafaf8;color:#111;padding:20px;border-radius:10px;display:grid;grid-template-columns:1fr;gap:16px;min-height:340px">
  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #111;padding-bottom:12px">
    <div style="font-size:22px;font-weight:400;letter-spacing:-.02em">Gomoku</div>
    <div style="font-size:12px;letter-spacing:.15em;text-transform:uppercase">Coup 12 · Tour Noir</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(9,1fr);gap:0;aspect-ratio:1;max-width:380px;margin:0 auto">
    ${Array.from({ length: 81 }).map((_, i) => {
      const hasStone = [10, 28, 46, 19, 37, 55, 64].includes(i);
      const isBlack = [10, 28, 46, 64].includes(i);
      return `<div style="border:1px solid #ddd;display:flex;align-items:center;justify-content:center">${hasStone ? `<div style="width:70%;height:70%;border-radius:50%;background:${isBlack ? "#111" : "#fff"};border:1px solid #111"></div>` : ""}</div>`;
    }).join("")}
  </div>
  <div style="display:flex;justify-content:space-between;font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.6">
    <span>Humain — 0 captures</span>
    <span>IA — 0 captures</span>
  </div>
</div>`,
  },
];

// =========================================================================
// Canned assistant responses for the chat (rule-based, keyword-triggered)
// =========================================================================
export interface CannedAnswer {
  match: RegExp;
  content: string;
  codeBlocks?: Message["codeBlocks"];
  refPartId?: string;
}

export const CANNED_ANSWERS: CannedAnswer[] = [
  {
    match: /architecture|comment.*(marche|fonctionne)|globale/i,
    content:
      "**gomoku-ai** est une SPA vanilla TypeScript — aucun framework, aucun backend.\n\n" +
      "L'architecture suit une séparation en 4 couches :\n\n" +
      "1. **Moteur** (`src/engine/`) — représentation du plateau, règles, état de partie. 100% pur, zéro effet de bord.\n" +
      "2. **IA** (`src/ai/`) — Minimax + alpha-bêta avec heuristique de motifs. Tourne dans un Web Worker pour ne pas figer l'UI.\n" +
      "3. **Coordination** (`src/api/`) — un `EventBus` typé qui fait le pont entre moteur, IA et UI. Aucune API HTTP.\n" +
      "4. **UI** (`src/ui/`) — rendu DOM direct du plateau 15×15, gestion des clics, animations.\n\n" +
      "Le flux d'un coup : `clic → EventBus.emit('move') → Moteur.jouer() → IA.calcule() → EventBus.emit('ai-move') → UI.render()`.",
  },
  {
    match: /ia|intelligence|minimax|alpha|beta|adversaire|robot|bot/i,
    content:
      "L'IA repose sur un **Minimax avec élagage alpha-bêta**, profondeur 4 par défaut.\n\n" +
      "L'heuristique scanne 6 motifs clés sur le plateau :\n\n" +
      "- **open-3** (3 alignés, deux extrémités libres) → forte menace\n" +
      "- **closed-3** (une extrémité bloquée) → menace modérée\n" +
      "- **open-4** → coup gagnant quasi certain\n" +
      "- **double-3** → double menace, généralement décisif\n" +
      "- **capture** (tirelire de 5 capturables)\n" +
      "- **blocage** adverse (contre-menace)\n\n" +
      "Performances : ~12k nœuds évalués par coup, réponse en <300ms grâce au worker et à l'élagage. Le code est dans `src/ai/` :",
    codeBlocks: [
      {
        language: "typescript",
        filename: "src/ai/Minimax.ts",
        code: `export function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  if (depth === 0 || board.isTerminal()) {
    return Heuristic.evaluate(board);
  }
  const moves = board.generateCandidateMoves(8);
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      board.play(m);
      best = Math.max(best, minimax(board, depth - 1, alpha, beta, false));
      board.undo(m);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break; // élagage
    }
    return best;
  }
  // ... branche symétrique pour minimizing
}`,
      },
    ],
    refPartId: "ai",
  },
  {
    match: /frontend|interface|ui|interface|rendu|dom|plateau/i,
    content:
      "L'interface est rendue en **DOM direct** (pas de React, pas de framework). Le plateau 15×15 utilise CSS Grid, et un overlay Canvas dessine les indicateurs de dernier coup.\n\n" +
      "Points clés :\n\n" +
      "- `BoardView.ts` — génère 225 cellules, attache les listeners de clic\n" +
      "- `HUD.ts` — affiche le tour, le score, le bouton undo\n" +
      "- `Animations.ts` — transition de pose de pierre (scale + opacity, 180ms)\n\n" +
      "Le code est verbeux mais lisible. Exemple de génération du plateau :",
    codeBlocks: [
      {
        language: "typescript",
        filename: "src/ui/BoardView.ts",
        code: `export class BoardView {
  private root: HTMLElement;
  private cells: HTMLButtonElement[] = [];

  constructor(root: HTMLElement, onMove: (x: number, y: number) => void) {
    this.root = root;
    this.root.style.display = "grid";
    this.root.style.gridTemplateColumns = "repeat(15, 1fr)";
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.addEventListener("click", () => onMove(x, y));
        this.cells.push(cell);
        this.root.appendChild(cell);
      }
    }
  }

  render(state: GameState) { /* ... */ }
}`,
      },
    ],
    refPartId: "ui",
  },
  {
    match: /dépend|depend|package|librairie|library|extern/i,
    content:
      "Le dépôt a **4 dépendances** (toutes en devDependencies — le projet n'a aucune dépendance runtime) :\n\n" +
      "| Dépendance | Version | Rôle |\n" +
      "| --- | --- | --- |\n" +
      "| vite | ^5.4.0 | Bundler dev server |\n" +
      "| typescript | ^5.5.0 | Typage statique |\n" +
      "| vitest | ^2.0.0 | Runner de tests |\n" +
      "| lucide-icons | ^0.460.0 | Icônes UI |\n\n" +
      "C'est un projet très léger — aucun framework UI, aucune librairie d'état. Tout est codé main. C'est une force (zéro dette technique) mais aussi une limite (l'UI deviendra difficile à maintenir si on ajoute des écrans).",
    refPartId: "config",
  },
  {
    match: /test|vitest|coverage|couverture/i,
    content:
      "Tests **Vitest**, 73% de couverture sur la couche logique (moteur + IA), **0% sur l'UI**.\n\n" +
      "Points forts :\n" +
      "- `Board.test.ts` couvre tous les cas d'alignement (horizontal, vertical, 2 diagonales)\n" +
      "- `Heuristic.test.ts` valide les scores des 6 motifs\n\n" +
      "Manques :\n" +
      "- Aucun test d'intégration sur le `Controller`\n" +
      "- Aucun test snapshot sur le rendu UI\n" +
      "- Pas de test de performance sur l'IA",
    refPartId: "tests",
  },
  {
    match: /améliorer|improve|ameliore|optimis/i,
    content:
      "Voici 5 pistes d'amélioration, classées par impact/effort :\n\n" +
      "1. **UI : migrer vers React/Preact** (effort moyen, impact élevé) — le DOM direct devient coûteux à maintenir dès qu'on ajoute des écrans (menu, paramètres, historique).\n" +
      "2. **IA : iterative deepening** (effort faible, impact moyen) — au lieu de profondeur fixe 4, monter tant qu'il reste du temps budget. Gain ~30% ELO.\n" +
      "3. **Tests : couvrir l'UI** (effort faible, impact élevé) — Testing Library + jsdom, monter à 85% global.\n" +
      "4. **Perf : transposition table** (effort moyen, impact élevé) — cache des positions déjà évaluées via hash Zobrist. Gain 2-3x sur l'IA.\n" +
      "5. **Accessibilité** (effort moyen, impact élevé) — navigation clavier, ARIA, contraste. Actuellement injouable au clavier.\n\n" +
      "Si vous voulez, je peux générer une maquette de la nouvelle UI avant de toucher au code — c'est l'objet de la **Phase 4**.",
  },
  {
    match: /dériv|deriv|transformer|autre projet|nouveau/i,
    content:
      "Plusieurs dérivés intéressants sont possibles à partir de cette base :\n\n" +
      "- **Gomoku en ligne (multiplayer)** — ajouter un backend WebSocket, conserver le moteur tel quel\n" +
      "- **Gomoku tournament platform** — wrapper le moteur dans une API REST, ajouter un ladder ELO\n" +
      "- **Éditeur de niveaux / puzzles** — réutiliser le moteur pour valider des positions de puzzle (type chess.com)\n" +
      "- **Port mobile React Native** — l'IA et le moteur sont portables tels quels, seul l'UI change\n\n" +
      "Le moteur (`src/engine/`) est la pièce la plus réutilisable — 0 dépendance, 0 effet de bord. C'est un excellent point d'ancrage pour un dérivé.",
  },
  {
    match: /adapt|ecommerce|e-commerce|site web|autre usage/i,
    content:
      "Adapter ce projet à un usage totalement différent est possible mais demande de bien cibler ce qu'on garde :\n\n" +
      "**Ce qui est réutilisable** : la structure de dossier, le build Vite, le bus d'événements typé, les tests Vitest.\n\n" +
      "**Ce qui doit être jeté** : tout `src/engine/`, `src/ai/` — c'est 40% du code mais 0% de valeur pour un autre usage.\n\n" +
      "Exemple concret : adapter en **site e-commerce**. On garde le squelette (Vite + TS + EventBus), on remplace le métier. La maquette de la Phase 4 sert exactement à valider cette transition avant de coder.",
  },
  {
    match: /code|montre|fichier|voir|show|exempl/i,
    content:
      "Voici un extrait du cœur du moteur — la détection d'alignement. C'est la fonction la plus critique du projet, appelée à chaque coup :",
    codeBlocks: [
      {
        language: "typescript",
        filename: "src/engine/Rules.ts",
        code: `const DIRECTIONS = [
  [1, 0],   // horizontal
  [0, 1],   // vertical
  [1, 1],   // diagonale \
  [1, -1],  // diagonale /
] as const;

export function checkWin(board: Board, x: number, y: number): boolean {
  const player = board.get(x, y);
  if (player === 0) return false;

  for (const [dx, dy] of DIRECTIONS) {
    let count = 1;
    // compte dans les deux sens
    for (const sign of [-1, 1]) {
      let nx = x + dx * sign;
      let ny = y + dy * sign;
      while (board.inBounds(nx, ny) && board.get(nx, ny) === player) {
        count++;
        nx += dx * sign;
        ny += dy * sign;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}`,
      },
    ],
    refPartId: "engine",
  },
  {
    match: /bonjour|salut|hello|coucou|hey/i,
    content:
      "Bonjour 👋 J'ai fini l'analyse de **gomoku-ai**. Vous pouvez me poser n'importe quelle question sur le dépôt — architecture, IA, tests, dépendances, pistes d'amélioration. Quand vous êtes prêt, on peut passer à la **Phase 2** pour déclarer votre intention (améliorer / dériver / adapter).",
  },
];

export const DEFAULT_ANSWER: CannedAnswer = {
  content:
    "Bonne question. D'après mon analyse du dépôt, **gomoku-ai** est une SPA TypeScript vanilla avec un moteur de jeu découplé d'une IA Minimax. Posez-moi des questions sur :\n\n" +
    "- l'**architecture** globale\n" +
    "- l'**IA** (minimax, heuristique)\n" +
    "- le **frontend** (rendu DOM)\n" +
    "- les **dépendances**\n" +
    "- les **tests**\n" +
    "- des **pistes d'amélioration**\n" +
    "- des idées de **projet dérivé**\n" +
    "- une **adaptation** à un autre usage\n\n" +
    "Vous pouvez aussi me demander de **montrer le code** d'une partie spécifique.",
};
