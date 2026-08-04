"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  Loader2,
  FileCode2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextFile {
  filename: string;
  description: string;
  target: string;
  content: string;
}

interface ContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePath?: string;
  sourceName?: string;
}

const AGENTS = [
  { id: "pi", label: "Pi", color: "bg-emerald-500" },
  { id: "claude-code", label: "Claude Code", color: "bg-amber-600" },
  { id: "aider", label: "Aider", color: "bg-sky-500" },
  { id: "cursor", label: "Cursor", color: "bg-violet-500" },
  { id: "continue", label: "Continue.dev", color: "bg-rose-500" },
  { id: "universal", label: "Universel", color: "bg-brand" },
];

export function ContextDialog({
  open,
  onOpenChange,
  sourcePath,
  sourceName,
}: ContextDialogProps) {
  const [task, setTask] = React.useState("");
  const [selectedTargets, setSelectedTargets] = React.useState<Set<string>>(
    new Set(AGENTS.map((a) => a.id))
  );
  const [files, setFiles] = React.useState<ContextFile[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloadLoading, setDownloadLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setFiles(null);
      setError(null);
      setTask("");
      setSelectedTargets(new Set(AGENTS.map((a) => a.id)));
    }
  }, [open]);

  // Générer un aperçu des fichiers
  const handleGenerate = async () => {
    if (!sourcePath) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: sourcePath,
          task: task.trim() || undefined,
          targets: [...selectedTargets],
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setFiles(data.files);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Télécharger le zip
  const handleDownload = async () => {
    if (!sourcePath) return;
    setDownloadLoading(true);

    try {
      const res = await fetch("/api/context/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: sourcePath,
          task: task.trim() || undefined,
          targets: [...selectedTargets],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur de téléchargement");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orizon-contexte-${sourceName ?? "projet"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDownloadLoading(false);
    }
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-brand" />
            Générer le contexte — {sourceName ?? "ce projet"}
          </DialogTitle>
          <DialogDescription>
            Fichiers de contexte pour agents de codage (Pi, Claude Code, Aider, Cursor...).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mission */}
          <div className="space-y-1.5">
            <Label htmlFor="context-task" className="text-xs">
              Mission / tâche (optionnel)
            </Label>
            <Textarea
              id="context-task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="ex: Ajouter une interface de trading crypto, garder les modules auth et db..."
              className="text-sm resize-none h-16"
            />
          </div>

          {/* Sélection des agents */}
          <div className="space-y-1.5">
            <Label className="text-xs">Agents cibles</Label>
            <div className="flex flex-wrap gap-1.5">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => toggleTarget(agent.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors",
                    selectedTargets.has(agent.id)
                      ? "border-brand bg-brand-soft/40 text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", agent.color)} />
                  {agent.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-brand hover:bg-brand-strong text-background"
              disabled={loading || !sourcePath}
              onClick={handleGenerate}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <FileCode2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              Aperçu
            </Button>

            {files && (
              <Button
                size="sm"
                variant="outline"
                disabled={downloadLoading}
                onClick={handleDownload}
              >
                {downloadLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                Télécharger (.zip)
              </Button>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2.5 text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Résultat : aperçu des fichiers */}
          {files && (
            <div className="space-y-2 zcode-fade-up">
              <Label className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {files.length} fichiers générés
              </Label>

              <div className="space-y-1 max-h-60 overflow-y-auto border border-border rounded-md p-2">
                {files.map((file) => (
                  <div key={file.filename} className="p-2 rounded hover:bg-accent/50">
                    <div className="flex items-center gap-1.5">
                      <FileCode2 className="w-3 h-3 text-brand shrink-0" />
                      <span className="text-xs font-medium">{file.filename}</span>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-1 rounded">
                        {file.target}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                      {file.description}
                    </p>
                    <details className="ml-5 mt-1">
                      <summary className="text-[10px] text-muted-foreground/60 cursor-pointer hover:text-foreground">
                        Voir le contenu
                      </summary>
                      <pre className="text-[10px] text-muted-foreground/80 mt-1 p-2 bg-background rounded border border-border max-h-32 overflow-y-auto">
                        {file.content.slice(0, 500)}
                        {file.content.length > 500 && "\n..."}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}