"use client";

import * as React from "react";
import { ZCODE_SKILLS, OSS_INTEGRATIONS } from "@/lib/zcode/oss-catalog";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { ChevronRight, Package2 } from "lucide-react";

interface SkillsPanelProps {
  /** compact mode for embedding inside the progress panel */
  variant?: "compact" | "full";
}

export function SkillsPanel({ variant = "compact" }: SkillsPanelProps) {
  const [expanded, setExpanded] = React.useState(true);

  const activeCount = ZCODE_SKILLS.filter((s) => s.active).length;
  const totalCount = ZCODE_SKILLS.length;

  if (variant === "compact") {
    return (
      <div className="px-3 pt-3 pb-1 border-b border-sidebar-border">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 px-1 mb-1.5 hover:text-muted-foreground transition-colors"
        >
          <Package2 className="w-3 h-3" />
          Skills IA
          <span className="text-muted-foreground/50 normal-case tracking-normal">
            {activeCount}/{totalCount} actifs
          </span>
          <ChevronRight
            className={cn(
              "w-3 h-3 ml-auto transition-transform",
              expanded && "rotate-90"
            )}
          />
        </button>

        {expanded && (
          <div className="space-y-1 zcode-fade-up">
            {ZCODE_SKILLS.map((skill) => {
              const Icon = (Icons as Record<string, React.ElementType>)[skill.icon] ?? Icons.Package;
              return (
                <div
                  key={skill.id}
                  className={cn(
                    "flex items-start gap-2 rounded-md border p-2 transition-colors",
                    skill.active
                      ? "border-brand bg-brand-soft/40"
                      : "border-sidebar-border bg-background/20 opacity-60"
                  )}
                  title={skill.description}
                >
                  <div
                    className={cn(
                      "shrink-0 w-5 h-5 rounded flex items-center justify-center",
                      skill.active
                        ? "bg-brand-soft text-brand"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-foreground truncate">
                        {skill.name}
                      </span>
                      {skill.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-add shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {skill.description}
                    </div>
                    {skill.poweredBy && (
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground/60">
                        <Package2 className="w-2.5 h-2.5" />
                        <span className="font-mono">
                          {OSS_INTEGRATIONS.find((o) => o.id === skill.poweredBy)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Link to full catalog */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="block text-center text-[10px] text-brand hover:opacity-80 pt-1.5"
            >
              Voir le catalogue complet ({OSS_INTEGRATIONS.length} intégrations OSS)
            </a>
          </div>
        )}
      </div>
    );
  }

  // Full variant — standalone page/modal (future use)
  return (
    <div className="space-y-3">
      {ZCODE_SKILLS.map((s) => (
        <div key={s.id} className="rounded-lg border border-border p-3">
          <div className="text-sm font-medium">{s.name}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.description}</div>
        </div>
      ))}
    </div>
  );
}
