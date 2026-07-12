"use client";

import * as React from "react";
import { useZCode, MOCK_REPO } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import { SkillsPanel } from "@/components/zcode/skills-panel";
import {
  Check,
  Loader2,
  Circle,
  ScanLine,
  Layers,
  Boxes,
  FileSearch,
  Package,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type { ComprehensionStep, PartKind } from "@/lib/zcode/types";

const STEP_ICONS: Record<string, React.ElementType> = {
  scan: ScanLine,
  "detect-stack": Boxes,
  sequence: Layers,
  analyze: FileSearch,
  deps: Package,
  summarize: Sparkles,
};

const PART_KIND_META: Record<
  PartKind,
  { label: string; color: string; bg: string; border: string }
> = {
  frontend: {
    label: "Frontend",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  backend: {
    label: "Backend",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  api: {
    label: "API",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  config: {
    label: "Config",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  deps: {
    label: "Dépendances",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  tests: {
    label: "Tests",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  docs: {
    label: "Docs",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/20",
  },
};

export function ProgressPanel() {
  const {
    steps,
    comprehensionDone,
    comprehensionRunning,
    startComprehension,
  } = useZCode();

  const doneCount = steps.filter((s) => s.status === "completed").length;
  const total = steps.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <aside className="flex flex-col h-full bg-sidebar border-l border-sidebar-border overflow-hidden">
      {/* Header — h-14 to align with chat panel & sidebar headers */}
      <div className="flex items-center justify-center h-14 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progression
          </span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border",
              comprehensionDone
                ? "bg-add-soft border-add text-add"
                : comprehensionRunning
                ? "bg-brand-soft border-brand text-brand"
                : "bg-secondary border-border text-muted-foreground"
            )}
          >
            {comprehensionDone
              ? "Terminé"
              : comprehensionRunning
              ? "En cours"
              : "En attente"}
          </span>
        </div>
      </div>

      {/* Progress bar — h-12 to align with the phase journey bar on the chat panel */}
      <div className="flex items-center h-12 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                comprehensionDone
                  ? "bg-add"
                  : comprehensionRunning
                  ? "bg-brand"
                  : "bg-muted-foreground/30"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
            {doneCount}/{total}
          </span>
        </div>
      </div>

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto zcode-scroll">
        <div className="px-3 py-2">
          {steps.map((step, i) => (
            <StepRow key={step.id} step={step} isLast={i === steps.length - 1} />
          ))}
        </div>

        {/* Sequenced parts — only once comprehension is done */}
        {comprehensionDone && (
          <div className="px-3 pb-3 zcode-fade-up">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-1 mb-1.5 mt-2">
              Parties séquencées
            </div>
            <div className="space-y-1">
              {MOCK_REPO.parts.map((p) => {
                const meta = PART_KIND_META[p.kind];
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-lg border p-2.5 bg-background/30",
                      meta.border
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium",
                          meta.bg,
                          meta.color
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs font-medium truncate flex-1">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {p.files}f · {p.lines}l
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.technologies.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[9px] bg-secondary/60 border border-sidebar-border px-1.5 py-0.5 rounded text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dependencies */}
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-1 mb-1.5 mt-3">
              Dépendances ({MOCK_REPO.dependencies.length})
            </div>
            <div className="space-y-0.5">
              {MOCK_REPO.dependencies.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2 text-[11px] px-2 py-1 rounded hover:bg-background/30"
                >
                  <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="font-mono text-foreground/90 truncate">
                    {d.name}
                  </span>
                  <span className="text-muted-foreground/60 font-mono text-[10px]">
                    {d.version}
                  </span>
                  <span className="text-muted-foreground/70 ml-auto truncate hidden lg:inline">
                    {d.role}
                  </span>
                </div>
              ))}
            </div>

            {/* Security note */}
            <div className="mt-3 rounded-md border border-add bg-add-soft p-2.5 flex items-start gap-2">
              <Check className="w-3 h-3 text-add shrink-0 mt-0.5" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-foreground">Aucun secret détecté.</span>{" "}
                Le dépôt ne contient pas de clés API ou de tokens exposés.
              </div>
            </div>

            {/* Skills IA — capabilities active for this session */}
            <SkillsPanel variant="compact" />
          </div>
        )}

        {/* Empty state hint when not started */}
        {!comprehensionDone && !comprehensionRunning && (
          <div className="px-3 pb-4">
            <div className="rounded-md border border-dashed border-border p-3 text-center">
              <AlertCircle className="w-4 h-4 text-muted-foreground/60 mx-auto mb-1.5" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                L'analyse n'a pas encore commencé. Cliquez sur{" "}
                <span className="text-foreground font-medium">
                  « Lancer l'analyse »
                </span>{" "}
                dans le panneau central.
              </div>
              <button
                onClick={startComprehension}
                className="mt-2 text-[11px] text-brand hover:opacity-80 font-medium"
              >
                Lancer maintenant →
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function StepRow({
  step,
  isLast,
}: {
  step: ComprehensionStep;
  isLast: boolean;
}) {
  const Icon = STEP_ICONS[step.id] ?? Circle;
  return (
    <div className="relative flex gap-2.5 pb-3">
      {/* connector */}
      {!isLast && (
        <div className="absolute left-[11px] top-7 bottom-0 w-px bg-sidebar-border" />
      )}
      {/* icon */}
      <div
        className={cn(
          "shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-colors z-10 bg-sidebar",
          step.status === "completed"
            ? "border-add bg-add-soft text-add"
            : step.status === "running"
            ? "border-brand bg-brand-soft text-brand"
            : step.status === "error"
            ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
            : "border-border text-muted-foreground/60"
        )}
      >
        {step.status === "completed" ? (
          <Check className="w-3 h-3" />
        ) : step.status === "running" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Icon className="w-3 h-3" />
        )}
      </div>
      {/* text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div
          className={cn(
            "text-xs font-medium transition-colors",
            step.status === "completed"
              ? "text-foreground"
              : step.status === "running"
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {step.label}
        </div>
        <div
          className={cn(
            "text-[10.5px] leading-relaxed mt-0.5 transition-colors",
            step.status === "completed"
              ? "text-muted-foreground"
              : step.status === "running"
              ? "text-muted-foreground"
              : "text-muted-foreground/50"
          )}
        >
          {step.detail}
        </div>
        {step.status === "running" && (
          <div className="text-[10px] text-brand mt-1 zcode-pulse-soft">
            traitement…
          </div>
        )}
      </div>
    </div>
  );
}
