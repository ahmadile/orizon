"use client";

import * as React from "react";
import { useZCode, PHASES } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import {
  Search,
  Target,
  FlaskConical,
  LayoutTemplate,
  FileCode2,
  Check,
  Lock,
} from "lucide-react";
import type { PhaseId } from "@/lib/zcode/types";

const ICONS: Record<PhaseId, React.ElementType> = {
  comprehension: Search,
  intention: Target,
  experimentation: FlaskConical,
  maquette: LayoutTemplate,
  generation: FileCode2,
};

export function PhaseJourney() {
  const { phase, setPhase, comprehensionDone } = useZCode();

  const phaseIdx = PHASES.findIndex((p) => p.id === phase);
  const comprehensionIdx = 0;

  return (
    <div className="border-b border-border bg-background px-6 py-2.5">
      <div className="max-w-3xl mx-auto flex items-center gap-1">
        {PHASES.map((p, i) => {
          const Icon = ICONS[p.id];
          const isActive = p.id === phase;
          const isDone = i < phaseIdx;
          const isComprehensionDone = p.id === "comprehension" && comprehensionDone;
          const isLocked =
            i > comprehensionIdx && !comprehensionDone && !isDone;

          const clickable = !isLocked || isDone;

          return (
            <React.Fragment key={p.id}>
              <button
                onClick={() => clickable && setPhase(p.id)}
                disabled={!clickable}
                className={cn(
                  "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs",
                  isActive
                    ? "bg-secondary border border-emerald-500/30 text-foreground"
                    : isDone || isComprehensionDone
                    ? "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    : isLocked
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
                title={isLocked ? "Terminez la compréhension d'abord" : p.description}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-emerald-500 text-background"
                      : isDone || isComprehensionDone
                      ? "bg-emerald-500/15 text-emerald-400"
                      : isLocked
                      ? "bg-secondary/50 text-muted-foreground/40"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {isDone || isComprehensionDone ? (
                    <Check className="w-3 h-3" />
                  ) : isLocked ? (
                    <Lock className="w-2.5 h-2.5" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </span>
                <span
                  className={cn(
                    "hidden sm:inline font-medium",
                    isActive && "text-foreground"
                  )}
                >
                  {p.shortLabel}
                </span>
              </button>
              {i < PHASES.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 min-w-2 transition-colors",
                    i < phaseIdx ? "bg-emerald-500/40" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
