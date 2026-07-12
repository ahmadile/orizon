"use client";

import * as React from "react";
import { useZCode } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, Wrench, Split, Shuffle, Target } from "lucide-react";
import type { Intent } from "@/lib/zcode/types";

const OPTIONS: {
  id: Intent;
  label: string;
  desc: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  {
    id: "improve",
    label: "Améliorer le projet existant",
    desc: "Garder le même produit, monter en qualité : UX, perf, tests, accessibilité.",
    icon: Wrench,
    accent: "emerald",
  },
  {
    id: "derive",
    label: "Créer un projet dérivé",
    desc: "Réutiliser une partie du code pour bâtir un produit différent mais apparenté.",
    icon: Split,
    accent: "sky",
  },
  {
    id: "adapt",
    label: "Adapter à un usage complètement différent",
    desc: "Changer de domaine (ex. agent → e-commerce) en gardant le squelette technique.",
    icon: Shuffle,
    accent: "violet",
  },
];

export function IntentPanel() {
  const { intent, setIntent, setPhase } = useZCode();
  const [selected, setSelected] = React.useState<Intent>(intent);

  return (
    <div className="my-4 rounded-xl border border-border bg-card overflow-hidden zcode-fade-up">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold">Phase 2 — Déclarez votre intention</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Cette intention oriente toute la suite du parcours. Vous pourrez la
          changer plus tard.
        </p>
      </div>

      <div className="p-3 grid gap-2">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const isSel = selected === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setSelected(o.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                isSel
                  ? "border-brand bg-brand-soft/60"
                  : "border-border hover:border-border hover:bg-accent/40"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isSel
                    ? "bg-brand-soft text-brand"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{o.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {o.desc}
                </div>
              </div>
              <span
                className={cn(
                  "w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-colors",
                  isSel
                    ? "bg-brand bg-brand"
                    : "border-border"
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-secondary/20">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="w-3 h-3 text-brand" />
          L'IA proposera des pistes concrètes adaptées à votre intention.
        </div>
        <button
          onClick={() => {
            setIntent(selected);
            setPhase("experimentation");
          }}
          disabled={!selected}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all",
            selected
              ? "bg-brand text-background hover:bg-brand-strong"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          Continuer
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
