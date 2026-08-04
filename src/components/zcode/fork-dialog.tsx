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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GitFork,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FolderOpen,
  FileCode2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ForkModule {
  name: string;
  kind: string;
  fileCount: number;
  lines: number;
  isReusable: boolean;
  rationale?: string;
}

interface ForkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chemin du projet source à forker */
  sourcePath?: string;
  /** Nom du projet source */
  sourceName?: string;
  /** Modules disponibles (depuis l'analyse) */
  modules?: ForkModule[];
}

type ForkStatus = "idle" | "analyzing" | "ready" | "forking" | "done" | "error";

interface ForkResult {
  success: boolean;
  copiedFiles: number;
  copiedModules: string[];
  skippedModules: string[];
  configFiles: string[];
  contextFiles: string[];
  gitInitialized: boolean;
  warnings: string[];
  targetPath: string;
  projectStructure?: string;
}

export function ForkDialog({
  open,
  onOpenChange,
  sourcePath,
  sourceName,
  modules: initialModules,
}: ForkDialogProps) {
  const [status, setStatus] = React.useState<ForkStatus>("idle");
  const [projectName, setProjectName] = React.useState("");
  const [targetPath, setTargetPath] = React.useState("");
  const [intention, setIntention] = React.useState("");
  const [selectedModules, setSelectedModules] = React.useState<Set<string>>(new Set());
  const [includeConfig, setIncludeConfig] = React.useState(true);
  const [initGit, setInitGit] = React.useState(true);
  const [result, setResult] = React.useState<ForkResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modules, setModules] = React.useState<ForkModule[]>(initialModules ?? []);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStatus("idle");
      setResult(null);
      setError(null);
      setProjectName(sourceName ? `${sourceName}-fork` : "");
      setTargetPath(sourcePath ? `${sourcePath}-fork` : "");
      setIntention("");
      setIncludeConfig(true);
      setInitGit(true);
    }
  }, [open, sourceName, sourcePath]);

  // Analyser le projet source pour obtenir les modules
  React.useEffect(() => {
    if (!open || !sourcePath || modules.length > 0) return;

    setStatus("analyzing");
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: sourcePath, agentic: false }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setStatus("error");
          return;
        }
        const forkModules: ForkModule[] = (data.modules ?? []).map((m: any) => ({
          name: m.name,
          kind: m.kind,
          fileCount: m.fileCount,
          lines: m.lines,
          isReusable: m.isReusable,
          rationale: m.reuseRationale,
        }));
        setModules(forkModules);
        // Sélectionner les modules réutilisables par défaut
        setSelectedModules(new Set(forkModules.filter((m) => m.isReusable).map((m) => m.name)));
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, [open, sourcePath, modules.length]);

  // Basculer la sélection d'un module
  const toggleModule = (name: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Lancer le fork
  const handleFork = async () => {
    if (!projectName.trim() || !targetPath.trim()) return;

    setStatus("forking");
    setError(null);

    try {
      const res = await fetch("/api/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath,
          targetPath: targetPath.trim(),
          projectName: projectName.trim(),
          modules: [...selectedModules],
          includeReusable: false, // On utilise la liste explicite
          includeConfig,
          intention: intention.trim() || undefined,
          initGit,
          initialCommit: true,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setStatus("error");
      } else {
        setResult(data);
        setStatus("done");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-brand" />
            Forker — {sourceName ?? "ce projet"}
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau projet à partir des modules réutilisables.
          </DialogDescription>
        </DialogHeader>

        {status === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
            <div className="text-sm text-muted-foreground">
              Analyse du projet source…
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="flex items-center gap-2 text-rose-400 font-medium">
              <XCircle className="w-4 h-4" />
              Erreur
            </div>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setStatus("idle")}
            >
              Réessayer
            </Button>
          </div>
        )}

        {(status === "ready" || status === "idle") && sourcePath && (
          <div className="space-y-4">
            {/* Source */}
            <div className="rounded-md bg-muted/30 p-3 text-xs">
              <span className="text-muted-foreground">Source : </span>
              <code className="text-foreground">{sourcePath}</code>
            </div>

            {/* Nom du projet */}
            <div className="space-y-1.5">
              <Label htmlFor="fork-name" className="text-xs">
                Nom du projet <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="fork-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="mon-projet-fork"
                className="text-sm"
              />
            </div>

            {/* Dossier cible */}
            <div className="space-y-1.5">
              <Label htmlFor="fork-target" className="text-xs">
                Dossier cible <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="fork-target"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="C:\Users\...\mon-projet-fork"
                className="text-sm font-mono text-xs"
              />
            </div>

            {/* Intention */}
            <div className="space-y-1.5">
              <Label htmlFor="fork-intent" className="text-xs">
                Intention (optionnel)
              </Label>
              <Textarea
                id="fork-intent"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="ex: creer un agent crypto a partir de ce projet"
                className="text-sm resize-none h-16"
              />
            </div>

            {/* Sélection des modules */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Modules à inclure
              </Label>
              <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-md p-2">
                {modules.map((mod) => (
                  <label
                    key={mod.name}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-accent/50 text-xs",
                      mod.fileCount === 0 && "opacity-40 pointer-events-none"
                    )}
                  >
                    <Checkbox
                      checked={selectedModules.has(mod.name)}
                      onCheckedChange={() => toggleModule(mod.name)}
                      disabled={mod.fileCount === 0}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">{mod.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1 rounded">
                          {mod.kind}
                        </span>
                        {mod.isReusable && (
                          <span className="text-[10px] text-emerald-400">♻️</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {mod.fileCount} fichiers · {mod.lines} lignes
                        {mod.rationale && ` — ${mod.rationale}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label className="text-xs">Options</Label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={includeConfig}
                    onCheckedChange={(v) => setIncludeConfig(v === true)}
                  />
                  Copier les fichiers de configuration (package.json, tsconfig, etc.)
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={initGit}
                    onCheckedChange={(v) => setInitGit(v === true)}
                  />
                  Initialiser git avec un commit initial
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                className="bg-brand hover:bg-brand-strong text-background"
                disabled={!projectName.trim() || !targetPath.trim()}
                onClick={handleFork}
              >
                <GitFork className="w-3.5 h-3.5 mr-1.5" />
                Forker
              </Button>
            </div>
          </div>
        )}

        {status === "forking" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
            <div className="text-sm text-muted-foreground">
              Création du fork en cours…
            </div>
            <div className="text-xs text-muted-foreground/60">
              Copie des modules, adaptation des configs, génération des contextes…
            </div>
          </div>
        )}

        {status === "done" && result && (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Fork créé avec succès
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <p>📁 <code className="text-foreground">{result.targetPath}</code></p>
                <p>📦 {result.copiedFiles} fichiers copiés</p>
                <p>🧩 {result.copiedModules.length} modules : {result.copiedModules.join(", ")}</p>
                {result.contextFiles.length > 0 && (
                  <p>📄 Fichiers de contexte : {result.contextFiles.join(", ")}</p>
                )}
                {result.gitInitialized && <p>✅ Git initialisé avec commit</p>}
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 text-amber-400 font-medium text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Avertissements
                </div>
                <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Fermer
              </Button>
              <Button
                size="sm"
                className="bg-brand hover:bg-brand-strong text-background"
                onClick={() => {
                  // Ouvrir le dossier dans l'explorateur (navigateur)
                  // Pour l'instant, on copie le chemin dans le presse-papier
                  navigator.clipboard.writeText(result.targetPath);
                }}
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                Chemin copié
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}