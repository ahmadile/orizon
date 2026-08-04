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
import { Input } from "@/components/ui/input";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Home,
  ArrowUp,
  Loader2,
  FileCode2,
  CheckCircle2,
  Github,
  Globe,
  AlertCircle,
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
  const [tab, setTab] = React.useState<"browse" | "clone">("browse");
  const [currentPath, setCurrentPath] = React.useState("");
  const [dirs, setDirs] = React.useState<DirEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Clone tab state
  const [cloneUrl, setCloneUrl] = React.useState("");
  const [cloning, setCloning] = React.useState(false);
  const [cloneResult, setCloneResult] = React.useState<{ path: string; name: string; owner: string; branch: string } | null>(null);

  async function handleClone() {
    if (!cloneUrl.trim()) return;
    setCloning(true);
    setError(null);
    setCloneResult(null);
    try {
      const res = await fetch("/api/repo/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cloneUrl.trim(), depth: 30 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Échec du clone");
        return;
      }
      setCloneResult({
        path: data.path,
        name: data.name,
        owner: data.owner,
        branch: data.branch,
      });
    } catch {
      setError("Erreur réseau pendant le clone");
    } finally {
      setCloning(false);
    }
  }

  function handleCloneConfirm() {
    if (cloneResult) {
      onRepoSelected(cloneResult.path, cloneResult.name);
      onOpenChange(false);
    }
  }

  // Load initial path (home) when dialog opens
  React.useEffect(() => {
    if (open && !currentPath) {
      loadDir("");
    }
  }, [open, currentPath]);

  // Reset when closed
  React.useLayoutEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(null);
      setScanResult(null);
      setError(null);
      setCloneUrl("");
      setCloneResult(null);
      setTab("browse");
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
            Ouvrir un dépôt
          </DialogTitle>
          <DialogDescription>
            Choisissez un dépôt local ou clonez directement depuis GitHub via son URL.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-2">
          <button
            onClick={() => setTab("browse")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs border-b-2 -mb-px transition-colors",
              tab === "browse"
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Naviguer (local)
          </button>
          <button
            onClick={() => setTab("clone")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs border-b-2 -mb-px transition-colors",
              tab === "clone"
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Github className="w-3.5 h-3.5" />
            Cloner depuis GitHub
          </button>
        </div>

        {tab === "clone" ? (
          <CloneTab
            cloneUrl={cloneUrl}
            setCloneUrl={setCloneUrl}
            cloning={cloning}
            cloneResult={cloneResult}
            error={error}
            onClone={handleClone}
            onConfirm={handleCloneConfirm}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// CloneTab — GitHub clone interface
// =========================================================================

interface CloneTabProps {
  cloneUrl: string;
  setCloneUrl: (v: string) => void;
  cloning: boolean;
  cloneResult: { path: string; name: string; owner: string; branch: string } | null;
  error: string | null;
  onClone: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function CloneTab({
  cloneUrl,
  setCloneUrl,
  cloning,
  cloneResult,
  error,
  onClone,
  onConfirm,
  onCancel,
}: CloneTabProps) {
  return (
    <div className="space-y-3">
      {/* URL input */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
          URL GitHub du dépôt
        </label>
        <div className="flex gap-1.5">
          <Input
            value={cloneUrl}
            onChange={(e) => setCloneUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="font-mono text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && cloneUrl.trim() && !cloning) {
                onClone();
              }
            }}
          />
          <Button
            onClick={onClone}
            disabled={!cloneUrl.trim() || cloning}
            className="bg-brand hover:bg-brand-strong text-background"
          >
            {cloning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                Clone…
              </>
            ) : (
              "Cloner"
            )}
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground/60 mt-1.5">
          Accepte : <code className="font-mono">https://github.com/owner/repo</code>,{" "}
          <code className="font-mono">owner/repo</code>, ou une URL avec branche.
          Dépôts publics uniquement (clone superficiel, 30 commits).
        </div>
      </div>

      {/* Cloning state */}
      {cloning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
          Clonage en cours… Récupération des 30 derniers commits.
        </div>
      )}

      {/* Clone result */}
      {cloneResult && !cloning && (
        <div className="rounded-md border border-brand bg-brand-soft/30 p-3 zcode-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Github className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium">{cloneResult.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              @{cloneResult.owner}
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded">
              {cloneResult.branch}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono truncate bg-background/40 rounded px-2 py-1">
            {cloneResult.path}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Dépôt cloné avec succès. Cliquez sur « Ouvrir ce dépôt » pour lancer l'analyse.
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2.5 text-xs text-rose-400 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-1.5 pt-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-muted-foreground"
        >
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!cloneResult}
          className="bg-brand hover:bg-brand-strong text-background"
        >
          Ouvrir ce dépôt
        </Button>
      </div>
    </div>
  );
}
