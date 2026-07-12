"use client";

import * as React from "react";
import { useZCode, MOCK_REPO } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import { FileCode2, Download, Copy, Check, ArrowRight, Bot } from "lucide-react";

export function GenerationPanel() {
  const { intent, sendMessage } = useZCode();
  const [copied, setCopied] = React.useState(false);
  const [tab, setTab] = React.useState<"md" | "agent">("md");

  const intentLabel =
    intent === "improve"
      ? "Amélioration du projet existant"
      : intent === "derive"
      ? "Projet dérivé"
      : intent === "adapt"
      ? "Adaptation à un autre usage"
      : "Projet cible";

  const md = React.useMemo(
    () => buildMd(MOCK_REPO.name, intentLabel),
    [intentLabel]
  );

  const copy = () => {
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-4 rounded-xl border border-border bg-card overflow-hidden zcode-fade-up">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold">
            Phase 5 — Génération
          </h3>
          <span className="text-[10px] uppercase tracking-wider bg-brand-soft border border-brand px-1.5 py-0.5 rounded text-brand ml-auto">
            {intentLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Fichier <code className="text-brand">PROJECT_STRUCTURE.md</code>{" "}
          réutilisable par n'importe quel agent de code, ou génération complète
          par l'agent intégré.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-3">
        <button
          onClick={() => setTab("md")}
          className={cn(
            "text-xs px-3 py-1.5 rounded-t-md border-b-2 -mb-px transition-all flex items-center gap-1.5",
            tab === "md"
              ? "bg-brand text-foreground bg-background/40"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileCode2 className="w-3 h-3" />
          PROJECT_STRUCTURE.md
        </button>
        <button
          onClick={() => setTab("agent")}
          className={cn(
            "text-xs px-3 py-1.5 rounded-t-md border-b-2 -mb-px transition-all flex items-center gap-1.5",
            tab === "agent"
              ? "bg-brand text-foreground bg-background/40"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Bot className="w-3 h-3" />
          Génération par l'agent
        </button>
        {tab === "md" && (
          <div className="ml-auto flex items-center gap-1 mb-1">
            <button
              onClick={copy}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-accent border border-border"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-brand" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copier
                </>
              )}
            </button>
            <button
              onClick={() =>
                download("PROJECT_STRUCTURE.md", md)
              }
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-accent border border-border"
            >
              <Download className="w-3 h-3" />
              Télécharger
            </button>
          </div>
        )}
      </div>

      {tab === "md" ? (
        <div className="p-3">
          <pre className="rounded-lg border border-border bg-[#0d0d0d] p-3 overflow-x-auto zcode-scroll text-[11px] leading-relaxed font-mono text-muted-foreground max-h-96">
            <code>{md}</code>
          </pre>
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-lg border border-brand bg-brand/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  L'agent intégré peut construire le projet de A à Z
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  À partir du fichier <code>PROJECT_STRUCTURE.md</code>{" "}
                  ci-contre, l'agent va : créer l'arborescence, écrire chaque
                  fichier listé, installer les dépendances, et lancer le build
                  de vérification. Comptez ~4 minutes pour un projet de cette
                  taille.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() =>
                      sendMessage(
                        "Lance la génération complète du projet cible à partir du fichier PROJECT_STRUCTURE.md"
                      )
                    }
                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand text-background hover:bg-brand-strong font-medium"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Lancer la génération
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    ~4 min · 42 fichiers · {MOCK_REPO.totalLines.toLocaleString("fr-FR")} lignes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Alternative :</strong>{" "}
            récupérez le fichier <code>PROJECT_STRUCTURE.md</code> dans l'onglet
            voisin et ouvrez-le dans l'agent de code de votre choix (Cursor,
            Claude Code, etc.). Le format est volontairement générique.
          </div>
        </div>
      )}
    </div>
  );
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMd(repoName: string, intentLabel: string): string {
  return `# PROJECT_STRUCTURE.md
# Généré par ZCode — ${new Date().toISOString().slice(0, 10)}
# Source : ${repoName} · Intention : ${intentLabel}

## 1. Objectif du projet cible

${intentLabel} à partir du dépôt \`${repoName}\`.
Le présent fichier décrit l'arborescence, les responsabilités de chaque
fichier et la stack technique attendue. Il est consommable par n'importe
quel agent de code (Cursor, Claude Code, ZCode, etc.).

## 2. Stack technique

- **Runtime** : Node.js 20+, TypeScript 5.5+ strict
- **Bundler** : Vite 5
- **Tests** : Vitest 2 + @testing-library/dom
- **Lint** : ESLint flat config + Prettier
- **UI** : React 19 + shadcn/ui (New York) + Tailwind CSS 4
- **État** : Zustand pour l'UI, TanStack Query pour le serveur
- **IA** : GLM-5.2 via z-ai-web-dev-sdk (backend only)

## 3. Arborescence cible

\`\`\`
${repoName}-v2/
├── public/
├── src/
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Écran principal (plateau)
│   │   └── api/
│   │       └── chat/route.ts   # Endpoint LLM (z-ai-web-dev-sdk)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui
│   │   └── game/
│   │       ├── Board.tsx       # Plateau 15×15
│   │       ├── HUD.tsx         # Score, tour, undo
│   │       └── Stone.tsx       # Pierre animée
│   ├── engine/                 # Moteur pur (repris du dépôt source)
│   │   ├── Board.ts
│   │   ├── Rules.ts
│   │   └── GameState.ts
│   ├── ai/
│   │   ├── Minimax.ts          # Repris du dépôt source
│   │   ├── Heuristic.ts
│   │   └── worker.ts           # Web Worker
│   ├── hooks/
│   │   └── useGame.ts          # State machine Zustand
│   └── lib/
│       └── utils.ts
├── tests/
│   ├── Board.test.ts
│   └── Heuristic.test.ts
├── prisma/
│   └── schema.prisma           # (si backend ajouté)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
\`\`\`

## 4. Responsabilités par fichier

### src/engine/Board.ts
- Représentation bitboard du plateau 15×15
- API : get(x,y), set(x,y,p), clone(), hash()
- 0 dépendance, 0 effet de bord, 0 import DOM

### src/engine/Rules.ts
- checkWin(board, x, y) : détecte 5 alignés
- legalMoves(board) : génère les coups candidats (8 voisins)
- Repris tel quel du dépôt source

### src/ai/Minimax.ts
- minimax(board, depth, alpha, beta, maximizing)
- Iterative deepening avec budget 300ms
- Tourne dans un Web Worker (src/ai/worker.ts)

### src/components/game/Board.tsx
- Grille 15×15 en CSS Grid
- Click handler → useGame.play(x,y)
- Animations Framer Motion sur la pose de pierre

### src/app/api/chat/route.ts
- POST /api/chat
- Appelle z-ai-web-dev-sdk côté serveur
- System prompt : "Tu es l'assistant du jeu Gomoku…"

## 5. Points d'entrée

- \`npm run dev\` → http://localhost:3000 (page principale)
- \`npm test\` → Vitest watch
- \`npm run build\` → build production

## 6. Zones sensibles (priorité d'attention)

1. **src/engine/Rules.ts** — la fonction checkWin est la plus critique
   du projet. Bien tester les 4 directions et les bornes.
2. **src/ai/worker.ts** — la communication main↔worker doit rester
   typée strictement. Éviter postMessage avec any.
3. **src/app/api/chat/route.ts** — ne jamais exposer la clé API côté
   client. Valider le body avec zod.

## 7. Différence avec le dépôt source

| Avant | Après |
|-------|-------|
| DOM direct | React 19 |
| Aucun framework UI | shadcn/ui + Tailwind 4 |
| 0% coverage UI | 85% coverage UI |
| Profondeur IA fixe (4) | Iterative deepening (300ms budget) |
| Aucun backend | API route /api/chat (LLM) |

## 8. Critères d'acceptation

- [ ] \`npm run build\` passe sans erreur
- [ ] \`npm test\` ≥ 80% coverage global
- [ ] Le plateau est jouable au clavier (accessibilité)
- [ ] L'IA répond en <500ms en profondeur 6
- [ ] Aucune clé API dans le bundle client
`;
}
