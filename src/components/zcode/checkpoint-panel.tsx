"use client";

import * as React from "react";
import { useZCode } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import {
  History,
  Plus,
  RotateCcw,
  GitBranch,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function CheckpointPanel() {
  const {
    checkpoints,
    createCheckpoint,
    restoreCheckpoint,
    forkConversation,
    hasRepo,
    messages,
  } = useZCode();

  if (!hasRepo) return null;

  return (
    <div className="px-3 py-2 border-t border-sidebar-border">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <History className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Checkpoints
        </span>
        <span className="text-[10px] text-muted-foreground/50 normal-case">
          {checkpoints.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={createCheckpoint}
          className="ml-auto h-5 w-5 text-muted-foreground hover:text-brand"
          title="Créer un checkpoint"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Checkpoint list */}
      {checkpoints.length === 0 ? (
        <div className="text-[10px] text-muted-foreground/50 px-1 py-1 leading-relaxed">
          Aucun checkpoint. Créez-en un pour pouvoir revenir en arrière sans
          perdre votre progression.
        </div>
      ) : (
        <div className="space-y-1">
          {[...checkpoints].reverse().map((cp) => (
            <div
              key={cp.id}
              className="rounded-md border border-border bg-background/30 p-2 hover:bg-background/50 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium truncate flex-1">
                  {cp.label}
                </span>
                <button
                  onClick={() => restoreCheckpoint(cp.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-brand"
                  title="Restaurer ce checkpoint"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground/60">
                <span>{new Date(cp.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span>·</span>
                <span>{cp.messageCount} msg</span>
                <span>·</span>
                <span className="uppercase tracking-wider">{cp.phase}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fork button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => forkConversation()}
        className="w-full mt-2 h-7 text-[11px] text-muted-foreground hover:text-brand justify-start"
      >
        <GitBranch className="w-3 h-3 mr-1.5" />
        Créer une branche (fork)
      </Button>
    </div>
  );
}
