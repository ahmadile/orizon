"use client";

import * as React from "react";
import { useZCode, PHASES, MOCK_REPO } from "@/lib/zcode/store";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { Composer } from "./composer";
import { PhaseJourney } from "./phase-journey";
import { IntentPanel } from "./intent-panel";
import { ExperimentationPanel } from "./experimentation-panel";
import { MockupPanel } from "./mockup-panel";
import { GenerationPanel } from "./generation-panel";
import {
  GitBranch,
  Star,
  GitFork,
  Play,
  RotateCcw,
  ChevronDown,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PhaseId } from "@/lib/zcode/types";

export function ChatPanel() {
  const {
    messages,
    isAssistantTyping,
    comprehensionDone,
    comprehensionRunning,
    startComprehension,
    resetComprehension,
    phase,
  } = useZCode();

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isAssistantTyping]);

  return (
    <main className="flex flex-col h-full bg-background min-w-0">
      {/* Header */}
      <ChatHeader />

      {/* Phase journey (horizontal) */}
      <PhaseJourney />

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto zcode-scroll"
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          {/* Repo header card */}
          <RepoHeaderCard />

          {/* Comprehension launch state */}
          {!comprehensionDone && !comprehensionRunning && (
            <div className="my-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 zcode-fade-up">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    Prêt à analyser le dépôt
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    L'orchestration multi-agents va scanner {MOCK_REPO.totalFiles} fichiers,
                    détecter la stack, séquencer le projet et produire une synthèse
                    architecturale. Comptez ~8 secondes.
                  </p>
                  <Button
                    onClick={startComprehension}
                    size="sm"
                    className="mt-3 h-8 bg-emerald-500 hover:bg-emerald-600 text-background"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Lancer l'analyse
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isAssistantTyping && <TypingIndicator />}

          {/* Phase-specific inline panels */}
          {comprehensionDone && phase === "intention" && <IntentPanel />}
          {comprehensionDone && phase === "experimentation" && (
            <ExperimentationPanel />
          )}
          {comprehensionDone && phase === "maquette" && <MockupPanel />}
          {comprehensionDone && phase === "generation" && <GenerationPanel />}
        </div>
      </div>

      {/* Composer */}
      <Composer />
    </main>
  );
}

function ChatHeader() {
  const { resetComprehension, comprehensionDone, comprehensionRunning } =
    useZCode();
  const [modelOpen, setModelOpen] = React.useState(false);

  return (
    <header className="relative z-30 flex items-center gap-3 px-6 h-14 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">
            {MOCK_REPO.name}
          </span>
          <span className="text-[10px] text-muted-foreground truncate font-mono">
            {MOCK_REPO.path}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Repo stats */}
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {MOCK_REPO.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" />
            {MOCK_REPO.forks}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            main
          </span>
        </div>

        {/* Model selector — dropdown renders above the phase journey (header is z-30) */}
        <div className="relative">
          <button
            onClick={() => setModelOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs border border-border rounded-md px-2.5 py-1.5 hover:bg-accent bg-secondary/50 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            GLM-5.2
            <ChevronDown className={cn("w-3 h-3 transition-transform", modelOpen && "rotate-180")} />
          </button>
          {modelOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setModelOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-popover border border-border rounded-lg shadow-2xl py-1 w-60 zcode-fade-up">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 border-b border-border mb-1">
                  Modèle d'orchestration
                </div>
                {[
                  { id: "glm-5.2", name: "GLM-5.2", desc: "Orchestrateur (défaut)" },
                  { id: "glm-4.6", name: "GLM-4.6", desc: "Plus rapide, moins cher" },
                  { id: "glm-4.6v", name: "GLM-4.6V", desc: "Vision (mockup analysis)" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModelOpen(false)}
                    className="w-full flex items-start gap-2 px-3 py-1.5 text-left hover:bg-accent"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{m.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.desc}
                      </div>
                    </div>
                    {m.id === "glm-5.2" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Re-run comprehension */}
        {comprehensionDone && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={resetComprehension}
            disabled={comprehensionRunning}
            title="Relancer l'analyse"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </header>
  );
}

function RepoHeaderCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 my-2 zcode-fade-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-lg font-bold shrink-0">
          G
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold">{MOCK_REPO.name}</h2>
            <span className="text-[10px] uppercase tracking-wider bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground">
              {MOCK_REPO.primaryLanguage}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {MOCK_REPO.totalFiles} fichiers · {MOCK_REPO.totalLines.toLocaleString("fr-FR")} lignes
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {MOCK_REPO.description}
          </p>
        </div>
      </div>
      {/* Language bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden mt-3">
        {MOCK_REPO.languages.map((l) => (
          <div
            key={l.name}
            style={{ width: `${l.pct}%` }}
            className={cn(
              "h-full",
              l.name === "TypeScript" && "bg-sky-500",
              l.name === "CSS" && "bg-violet-500",
              l.name === "HTML" && "bg-amber-500",
              l.name === "JSON" && "bg-emerald-500"
            )}
            title={`${l.name} ${l.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {MOCK_REPO.languages.map((l) => (
          <span key={l.name} className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                l.name === "TypeScript" && "bg-sky-500",
                l.name === "CSS" && "bg-violet-500",
                l.name === "HTML" && "bg-amber-500",
                l.name === "JSON" && "bg-emerald-500"
              )}
            />
            {l.name} <span className="text-muted-foreground/60">{l.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
