"use client";

import * as React from "react";
import { useZCode } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import { FlaskConical, Lightbulb, ArrowRight, Plus } from "lucide-react";

interface Track {
  id: string;
  title: string;
  effort: "Faible" | "Moyen" | "Élevé";
  impact: "Faible" | "Moyen" | "Élevé";
  summary: string;
  steps: string[];
}

const TRACKS_BY_INTENT: Record<string, Track[]> = {
  improve: [
    {
      id: "t1",
      title: "Migrer l'UI vers React + shadcn/ui",
      effort: "Moyen",
      impact: "Élevé",
      summary:
        "Le DOM direct devient coûteux à maintenir dès qu'on ajoute des écrans. React apporte composant + état sans overhead.",
      steps: [
        "Ajouter React + Vite plugin",
        "Convertir BoardView en composant <Board/>",
        "Remplacer les animations manuelles par Framer Motion",
        "Ajouter shadcn/ui pour les boutons et la HUD",
      ],
    },
    {
      id: "t2",
      title: "Iterative deepening sur l'IA",
      effort: "Faible",
      impact: "Moyen",
      summary:
        "Monter en profondeur tant qu'il reste du budget temps. Gain ELO ~30% sans toucher à l'heuristique.",
      steps: [
        "Ajouter un budget temps (300ms)",
        "Boucler profondeur 2 → 4 → 6",
        "Couper sur timeout",
      ],
    },
    {
      id: "t3",
      title: "Couvrir l'UI avec Testing Library",
      effort: "Faible",
      impact: "Élevé",
      summary:
        "Couverture UI à 0% actuellement. Monter à 85% global avec jsdom + @testing-library/dom.",
      steps: [
        "Installer @testing-library/dom + jsdom",
        "Tests BoardView (clic, render pierre)",
        "Tests HUD (tour, score)",
        "CI: bloquer si coverage < 80%",
      ],
    },
  ],
  derive: [
    {
      id: "t1",
      title: "Gomoku en ligne (multiplayer WebSocket)",
      effort: "Élevé",
      impact: "Élevé",
      summary:
        "Garder le moteur tel quel, ajouter un backend Node + WebSocket pour deux joueurs distants.",
      steps: [
        "Extraire le moteur dans un package npm",
        "Backend Fastify + ws",
        "Protocole de message (move, undo, chat)",
        "Lobby + matchmaking",
      ],
    },
    {
      id: "t2",
      title: "Plateforme de tournois avec ladder ELO",
      effort: "Élevé",
      impact: "Élevé",
      summary:
        "Wrapper le moteur dans une API REST, ajouter un ladder ELO et un système de tournois à élimination.",
      steps: [
        "API REST (Fastify) : /games, /tournaments",
        "Schéma DB (users, games, tournaments)",
        "Calcul ELO après chaque partie",
        "Frontend tournois (bracket view)",
      ],
    },
    {
      id: "t3",
      title: "Éditeur de puzzles (type chess.com)",
      effort: "Moyen",
      impact: "Moyen",
      summary:
        "Réutiliser le moteur pour valider des positions de puzzle. Le joueur doit trouver le coup gagnant.",
      steps: [
        "Format de puzzle (FEN-like)",
        "Validation via Moteur.checkWin",
        "Catalogue de 50 puzzles",
        "UI mode puzzle",
      ],
    },
  ],
  adapt: [
    {
      id: "t1",
      title: "Adapter en site e-commerce (store de jeux de société)",
      effort: "Élevé",
      impact: "Élevé",
      summary:
        "Garder le squelette (Vite + TS + EventBus), jeter le moteur de Gomoku, ajouter catalog + panier + checkout.",
      steps: [
        "Supprimer src/engine et src/ai",
        "Garder EventBus pour le panier",
        "Catalogue produits (Stripe Products)",
        "Checkout Stripe Checkout",
        "Mockup d'abord (Phase 4)",
      ],
    },
    {
      id: "t2",
      title: "Transformer en dashboard analytics",
      effort: "Moyen",
      impact: "Élevé",
      summary:
        "Réutiliser la grille CSS et le pattern MVC, remplacer le plateau par des widgets de graphiques.",
      steps: [
        "Supprimer métier Gomoku",
        "Garder la structure de dossiers",
        "Ajouter Recharts",
        "Mockup dashboard (Phase 4)",
      ],
    },
  ],
};

const EFFORT_COLOR: Record<string, string> = {
  Faible: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Moyen: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Élevé: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export function ExperimentationPanel() {
  const { intent, setPhase, sendMessage } = useZCode();
  const tracks = (intent && TRACKS_BY_INTENT[intent]) || TRACKS_BY_INTENT.improve;
  const [expanded, setExpanded] = React.useState<string | null>(tracks[0]?.id ?? null);

  return (
    <div className="my-4 rounded-xl border border-border bg-card overflow-hidden zcode-fade-up">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">
            Phase 3 — Expérimentation
          </h3>
          {intent && (
            <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 ml-auto">
              intention : {intent}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Trois pistes concrètes basées sur votre intention. Cliquez pour
          détailler. Aucun code n'est encore écrit.
        </p>
      </div>

      <div className="p-3 grid gap-2">
        {tracks.map((t) => {
          const isOpen = expanded === t.id;
          return (
            <div
              key={t.id}
              className={cn(
                "rounded-lg border transition-all",
                isOpen
                  ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                  : "border-border bg-background/40"
              )}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : t.id)}
                className="w-full flex items-start gap-3 p-3 text-left"
              >
                <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {t.summary}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-wider border px-1.5 py-0.5 rounded",
                        EFFORT_COLOR[t.effort]
                      )}
                    >
                      Effort {t.effort}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-wider border px-1.5 py-0.5 rounded",
                        EFFORT_COLOR[t.impact]
                      )}
                    >
                      Impact {t.impact}
                    </span>
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-3 pl-14 zcode-fade-up">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Étapes pressenties
                  </div>
                  <ol className="space-y-1">
                    {t.steps.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-foreground/90 flex gap-2"
                      >
                        <span className="text-muted-foreground/60 font-mono">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() =>
                        sendMessage(
                          `Parle-moi plus en détail de la piste : ${t.title}`
                        )
                      }
                      className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-accent border border-border"
                    >
                      Discuter cette piste
                    </button>
                    <button
                      onClick={() => setPhase("maquette")}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                    >
                      Maquetter cette piste
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-border bg-secondary/20 flex items-center justify-between">
        <button
          onClick={() =>
            sendMessage(
              "Propose-moi d'autres pistes originales auxquelles je n'aurais pas pensé"
            )
          }
          className="text-[11px] flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3 h-3" />
          Demander d'autres pistes
        </button>
        <button
          onClick={() => setPhase("maquette")}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500 text-background hover:bg-emerald-600 font-medium"
        >
          Passer à la maquette
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
