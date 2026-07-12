"use client";

import * as React from "react";
import {
  Upload,
  FolderOpen,
  FileCode2,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onOpenRepo: () => void;
  onRepoScanned: (path: string, name: string, scan: ScanResult) => void;
}

interface ScanResult {
  path: string;
  name: string;
  stack: {
    primaryLanguage: string;
    languages: { name: string; pct: number }[];
    packageManager: string | null;
    frameworks: string[];
    totalFiles: number;
    totalLines: number;
    description: string;
  };
}

export function EmptyState({ onOpenRepo, onRepoScanned }: EmptyStateProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // HTML5 drag-and-drop — note: browsers don't expose folder paths on drop
  // for security reasons. We accept a single dropped file (the user can drop
  // a file FROM the folder) and read its path via webkitRelativePath.
  // For a real folder, the user must use the file input with webkitdirectory.

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    // Try to read a directory entry
    const entry = items[0].webkitGetAsEntry?.();
    if (entry && entry.isDirectory) {
      // Dropped a folder — but we can't get its absolute filesystem path
      // (browser security). We can still scan it via the File System Access API
      // or fall back to the folder picker.
      setError(
        "Pour des raisons de sécurité, les navigateurs ne permettent pas de lire le chemin absolu d'un dossier glissé. Utilisez le bouton « Choisir un dossier » pour sélectionner votre dépôt."
      );
      return;
    }

    // Dropped a file — check if it's from a repo
    const file = e.dataTransfer.files[0];
    if (file) {
      const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      if (relPath) {
        const folder = relPath.split("/")[0];
        setError(
          `Fichier déposé : ${file.name} (dossier : ${folder}). Pour analyser le dépôt complet, utilisez « Choisir un dossier ».`
        );
      }
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setScanning(true);

    // We can't get the absolute path from <input webkitdirectory>, but we
    // CAN scan the dropped files locally. For a real filesystem scan, we
    // need the folder picker API.
    // Workaround: send the file list to the server with the first file's
    // webkitRelativePath to reconstruct the tree.

    try {
      // Collect all files with their relative paths
      const fileList: { rel: string; size: number }[] = [];
      const fileContents: { rel: string; content: string }[] = [];
      for (let i = 0; i < Math.min(files.length, 200); i++) {
        const f = files[i];
        const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
        fileList.push({ rel, size: f.size });
        // Read text content for small files
        if (f.size < 100_000) {
          try {
            const content = await f.text();
            fileContents.push({ rel, content });
          } catch {
            // skip binary
          }
        }
      }

      const folderName = fileList[0]?.rel.split("/")[0] ?? "dépôt";

      // Send to server for analysis (no absolute path needed)
      const res = await fetch("/api/repo/analyze-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName,
          files: fileContents.map((f) => ({ path: f.rel, content: f.content.slice(0, 5000) })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Analyse impossible");
        setScanning(false);
        return;
      }

      const scan = await res.json();
      setScanResult(scan);
      setScanning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'analyse");
      setScanning(false);
    }
  };

  const handleConfirm = () => {
    if (scanResult) {
      onRepoScanned(scanResult.path, scanResult.name, scanResult);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto zcode-scroll">
      <div className="w-full max-w-2xl">
        {/* Brand hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-soft border border-brand mb-4">
            <Sparkles className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Bienvenue dans ZCode
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            La plateforme agentique qui comprend vos dépôts open source et vous
            accompagne pour les améliorer, les adapter ou en créer un dérivé.
          </p>
        </div>

        {/* Drag-and-drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all",
            dragOver
              ? "border-brand bg-brand-soft/30 scale-[1.01]"
              : "border-border bg-card/50 hover:border-brand/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            // @ts-expect-error — webkitdirectory is non-standard but widely supported
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFolderSelect}
          />

          {scanning ? (
            <div className="py-6">
              <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-3" />
              <div className="text-sm font-medium">Analyse du dépôt en cours…</div>
              <div className="text-xs text-muted-foreground mt-1">
                Lecture des fichiers, détection de la stack…
              </div>
            </div>
          ) : scanResult ? (
            <div className="text-left zcode-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium">{scanResult.name}</span>
                <button
                  onClick={() => setScanResult(null)}
                  className="ml-auto p-1 hover:bg-accent rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="bg-background/40 rounded-md p-2">
                  <div className="text-muted-foreground text-[10px]">Langage</div>
                  <div className="font-medium">{scanResult.stack.primaryLanguage}</div>
                </div>
                <div className="bg-background/40 rounded-md p-2">
                  <div className="text-muted-foreground text-[10px]">Fichiers</div>
                  <div className="font-medium">{scanResult.stack.totalFiles}</div>
                </div>
              </div>
              {scanResult.stack.frameworks.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {scanResult.stack.frameworks.map((fw) => (
                    <span
                      key={fw}
                      className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              )}
              <Button
                onClick={handleConfirm}
                className="w-full bg-brand hover:bg-brand-strong text-background"
              >
                Lancer l'analyse de ce dépôt
              </Button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-colors",
                  dragOver ? "bg-brand text-background" : "bg-secondary text-muted-foreground"
                )}
              >
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium mb-1">
                {dragOver ? "Relâchez pour déposer" : "Glissez-déposez votre dossier de dépôt"}
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                ou choisissez un dossier manuellement
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand hover:bg-brand-strong text-background"
                >
                  <FolderOpen className="w-4 h-4 mr-1.5" />
                  Choisir un dossier
                </Button>
                <Button
                  onClick={onOpenRepo}
                  variant="secondary"
                  className="bg-secondary hover:bg-secondary/80 border border-border text-foreground"
                >
                  <FileCode2 className="w-4 h-4 mr-1.5" />
                  Naviguer
                </Button>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-400 flex items-start gap-2">
            <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Feature hints */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          {[
            { icon: Sparkles, label: "Comprendre", desc: "Analyse multi-agents" },
            { icon: FileCode2, label: "Maquetter", desc: "Prototype à blanc" },
            { icon: CheckCircle2, label: "Générer", desc: "Code + diff" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-lg border border-border bg-card/30 p-3 text-center"
            >
              <f.icon className="w-4 h-4 text-brand mx-auto mb-1.5" />
              <div className="text-xs font-medium">{f.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
