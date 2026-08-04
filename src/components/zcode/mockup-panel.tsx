"use client";

import * as React from "react";
import { useZCode, MOCKUP_VARIANTS } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import { LayoutTemplate, ArrowRight, Eye, Code2, RefreshCw } from "lucide-react";

export function MockupPanel() {
  const { enterPhase, sendMessage } = useZCode();
  const [activeId, setActiveId] = React.useState(MOCKUP_VARIANTS[0].id);
  const [view, setView] = React.useState<"preview" | "code">("preview");

  const active = MOCKUP_VARIANTS.find((v) => v.id === activeId)!;

  return (
    <div className="my-4 rounded-xl border border-border bg-card overflow-hidden zcode-fade-up">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold">
            Phase 4 — Maquette (prototype à blanc)
          </h3>
          <span className="text-[10px] text-muted-foreground ml-auto">
            HTML/CSS pur · sans backend
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Trois directions visuelles pour valider la structure et l'ambiance
          avant d'investir dans du code fonctionnel.
        </p>
      </div>

      {/* Variant tabs */}
      <div className="flex items-center gap-1 px-3 pt-3">
        {MOCKUP_VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveId(v.id)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-t-md border-b-2 transition-all -mb-px",
              v.id === activeId
                ? "bg-brand text-foreground bg-background/40"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 mb-1">
          <button
            onClick={() => setView("preview")}
            className={cn(
              "text-xs flex items-center gap-1 px-2 py-1 rounded-md",
              view === "preview"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="w-3 h-3" />
            Aperçu
          </button>
          <button
            onClick={() => setView("code")}
            className={cn(
              "text-xs flex items-center gap-1 px-2 py-1 rounded-md",
              view === "code"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="w-3 h-3" />
            HTML
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="text-xs text-muted-foreground mb-2 px-1">
          {active.description}
        </div>

        {view === "preview" ? (
          <div className="rounded-lg border border-border overflow-hidden bg-background">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-secondary/30">
              <span className="w-2 h-2 rounded-full bg-rose-500/60" />
              <span className="w-2 h-2 rounded-full bg-amber-500/60" />
              <span className="w-2 h-2 rounded-full bg-brand/60" />
              <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                zcode://mockup/{active.id}
              </span>
              <button
                onClick={() => setView("code")}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
              >
                voir le code →
              </button>
            </div>
            <div
              className="p-4"
              dangerouslySetInnerHTML={{ __html: active.html }}
            />
          </div>
        ) : (
          <pre className="rounded-lg border border-border bg-[#0d0d0d] p-3 overflow-x-auto zcode-scroll text-[11px] leading-relaxed font-mono text-muted-foreground max-h-80">
            <code>{active.html.trim()}</code>
          </pre>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border bg-secondary/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              sendMessage(
                `Peux-tu dériver cette maquette "${active.label}" en ajoutant un écran de paramètres ?`
              )
            }
            className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary hover:bg-accent border border-border"
          >
            <RefreshCw className="w-3 h-3" />
            Itérer
          </button>
          <button
            onClick={() =>
              sendMessage(
                `Explique-moi en détail les choix de design de la maquette "${active.label}"`
              )
            }
            className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary hover:bg-accent border border-border"
          >
            Justifier les choix
          </button>
        </div>
        <button
          onClick={() => enterPhase("generation")}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand text-background hover:bg-brand-strong font-medium"
        >
          Valider et générer
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
