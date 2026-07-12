"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Home,
  ArrowUp,
  Loader2,
  FileCode2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoOpenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRepoSelected: (path: string, name: string) => void;
}

interface DirEntry {
  name: string;
  path: string;
  isProject: boolean;
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

export function RepoOpenDialog({ open, onOpenChange, onRepoSelected }: RepoOpenDialogProps) {
  const [currentPath, setCurrentPath] = React.useState("");
  const [dirs, setDirs] = React.useState<DirEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Load initial path (home) when dialog opens
  React.useEffect(() => {
    if (open && !currentPath) {
      loadDir("");
    }
  }, [open, currentPath]);

  // Reset when closed
  React.useEffect(() => {
    if (!open) {
      setSelected(null);
      setScanResult(null);
      setError(null);
    }
  }, [open]);

  async function loadDir(dirPath: string) {
    setLoading(true);
    setError(null);
    try {
      const url = dirPath
        ? `/api/repo/browse?path=${encodeURIComponent(dirPath)}`
        : "/api/repo/browse";
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to browse");
        return;
      }
      const data = await res.json();
      setCurrentPath(data.path);
      setDirs(data.dirs ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function scanDir(dirPath: string) {
    setScanning(true);
    setError(null);
    setScanResult(null);
    try {
      const res = await fetch("/api/repo/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dirPath }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Scan failed");
        return;
      }
      const data = await res.json();
      setScanResult(data);
    } catch {
      setError("Network error during scan");
    } finally {
      setScanning(false);
    }
  }

  function handleSelect(dir: DirEntry) {
    setSelected(dir.path);
    setScanResult(null);
    setError(null);
    scanDir(dir.path);
  }

  function handleConfirm() {
    if (scanResult) {
      onRepoSelected(scanResult.path, scanResult.name);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-brand" />
            Ouvrir un dépôt local
          </DialogTitle>
          <DialogDescription>
            Naviguez jusqu'au dossier du dépôt cloné. ZCode l'analysera automatiquement.
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb / path bar */}
        <div className="flex items-center gap-1 text-xs font-mono bg-background/50 border border-border rounded-md px-2 py-1.5 mb-2">
          <button
            onClick={() => loadDir("")}
            className="p-1 hover:bg-accent rounded"
            title="Accueil"
          >
            <Home className="w-3 h-3" />
          </button>
          <span className="text-muted-foreground truncate">{currentPath}</span>
          <button
            onClick={() => {
              const parts = currentPath.split("/");
              parts.pop();
              loadDir(parts.join("/") || "/");
            }}
            className="ml-auto p-1 hover:bg-accent rounded"
            title="Dossier parent"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>

        {/* Directory listing */}
        <div className="rounded-md border border-border bg-background/30 max-h-72 overflow-y-auto zcode-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Lecture du dossier…
            </div>
          ) : dirs.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">
              Aucun sous-dossier.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {dirs.map((d) => (
                <li key={d.path}>
                  <button
                    onClick={() => handleSelect(d)}
                    onDoubleClick={() => loadDir(d.path)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent/50 transition-colors",
                      selected === d.path && "bg-brand-soft/40"
                    )}
                  >
                    <Folder
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        d.isProject ? "text-brand" : "text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 truncate">{d.name}</span>
                    {d.isProject && (
                      <span className="text-[9px] uppercase tracking-wider bg-brand-soft text-brand border border-brand px-1.5 py-0.5 rounded">
                        projet
                      </span>
                    )}
                    {selected === d.path && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                    )}
                    <ChevronRight
                      className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadDir(d.path);
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Scan result preview */}
        {scanning && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
            Analyse du dépôt en cours…
          </div>
        )}

        {scanResult && !scanning && (
          <div className="rounded-md border border-brand bg-brand-soft/30 p-3 zcode-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <FileCode2 className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium">{scanResult.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono truncate ml-auto">
                {scanResult.path}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground">Langage principal</span>
                <div className="font-medium text-foreground">
                  {scanResult.stack.primaryLanguage}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Package manager</span>
                <div className="font-medium text-foreground">
                  {scanResult.stack.packageManager ?? "—"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Fichiers</span>
                <div className="font-medium text-foreground">
                  {scanResult.stack.totalFiles}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Lignes</span>
                <div className="font-medium text-foreground">
                  {scanResult.stack.totalLines.toLocaleString("fr-FR")}
                </div>
              </div>
            </div>
            {scanResult.stack.frameworks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {scanResult.stack.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded text-foreground"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            )}
            {/* Language bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden mt-2">
              {scanResult.stack.languages.map((l, i) => (
                <div
                  key={l.name}
                  style={{ width: `${l.pct}%` }}
                  className={cn(
                    "h-full",
                    l.name === "TypeScript" && "bg-sky-500",
                    l.name === "JavaScript" && "bg-amber-500",
                    l.name === "Python" && "bg-emerald-500",
                    l.name === "Rust" && "bg-rose-500",
                    l.name === "Go" && "bg-cyan-500",
                    l.name === "CSS" && "bg-violet-500",
                    l.name === "HTML" && "bg-orange-500",
                    l.name === "JSON" && "bg-yellow-500",
                    l.name === "Markdown" && "bg-slate-500",
                    l.name === "Shell" && "bg-green-500",
                    ![
                      "TypeScript",
                      "JavaScript",
                      "Python",
                      "Rust",
                      "Go",
                      "CSS",
                      "HTML",
                      "JSON",
                      "Markdown",
                      "Shell",
                    ].includes(l.name) && ["bg-pink-500", "bg-teal-500", "bg-indigo-500"][i % 3]
                  )}
                  title={`${l.name} ${l.pct}%`}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2 text-xs text-rose-400">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!scanResult}
            className="bg-brand hover:bg-brand-strong text-background"
          >
            Ouvrir ce dépôt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
