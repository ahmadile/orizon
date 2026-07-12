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
import * as Icons from "lucide-react";
import {
  Cloud,
  Plug,
  HardDrive,
  Check,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDERS, type ProviderId } from "@/lib/zcode/providers";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Cloud,
  Plug,
  HardDrive,
};

export function SettingsDialog({ open, onOpenChange, onSaved }: SettingsDialogProps) {
  const [providerId, setProviderId] = React.useState<ProviderId>("aionlabs");
  const [apiKey, setApiKey] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState(PROVIDERS[0].defaultBaseUrl);
  const [model, setModel] = React.useState(PROVIDERS[0].defaultModel);
  const [showKey, setShowKey] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load settings on open
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings ?? {};
        if (s.provider) setProviderId(s.provider as ProviderId);
        if (s.api_key) setApiKey(s.api_key);
        if (s.base_url) setBaseUrl(s.base_url);
        if (s.model) setModel(s.model);
      })
      .catch(() => setError("Impossible de charger les paramètres"))
      .finally(() => setLoading(false));
  }, [open]);

  // When provider changes, update baseUrl + model to provider defaults
  React.useEffect(() => {
    const p = PROVIDERS.find((x) => x.id === providerId);
    if (!p) return;
    setBaseUrl(p.defaultBaseUrl);
    setModel(p.defaultModel);
  }, [providerId]);

  const provider = PROVIDERS.find((p) => p.id === providerId)!;
  const ProviderIcon = ICON_MAP[provider.icon] ?? Cloud;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            provider: providerId,
            api_key: apiKey,
            base_url: baseUrl,
            model,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur de sauvegarde");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.Settings className="w-4 h-4 text-brand" />
            Paramètres — Provider IA
          </DialogTitle>
          <DialogDescription>
            Choisissez le provider d'IA qui alimente l'agent ZCode. Les clés API
            sont stockées localement dans votre base de données, jamais envoyées
            au client.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Chargement…
          </div>
        ) : (
          <div className="space-y-4">
            {/* Provider selection */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Provider
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map((p) => {
                  const Icon = ICON_MAP[p.icon] ?? Cloud;
                  const isSel = p.id === providerId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProviderId(p.id)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all",
                        isSel
                          ? "border-brand bg-brand-soft/40"
                          : "border-border hover:bg-accent/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            isSel ? "text-brand" : "text-muted-foreground"
                          )}
                        />
                        <span className="text-xs font-medium">{p.label}</span>
                        {p.local && (
                          <span className="ml-auto text-[9px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded">
                            local
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {p.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API key (hidden for Ollama) */}
            {provider.apiKeyRequired && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Clé API
                  </label>
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-brand hover:underline flex items-center gap-1"
                  >
                    Obtenir une clé
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider.id === "aionlabs" ? "alv2_…" : "sk-…"}
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    type="button"
                  >
                    {showKey ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Base URL */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Base URL
              </label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={provider.defaultBaseUrl}
                className="font-mono text-xs"
              />
            </div>

            {/* Model */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Modèle
              </label>
              <div className="flex gap-1.5">
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider.defaultModel}
                  className="font-mono text-xs flex-1"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {provider.models.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                      model === m
                        ? "border-brand text-brand bg-brand-soft/40"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Local info banner for Ollama */}
            {provider.local && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] p-2.5 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground">Mode local.</span> Aucune clé
                  API requise. Ollama doit être installé et lancé sur votre
                  machine. Téléchargez-le sur{" "}
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    ollama.com
                  </a>
                  .
                </div>
              </div>
            )}

            {/* Security note for cloud providers */}
            {!provider.local && (
              <div className="rounded-md border border-border bg-secondary/30 p-2.5 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  Votre clé est stockée localement en SQLite et utilisée
                  uniquement côté serveur pour appeler l'API du provider. Elle ne
                  transite jamais par le navigateur.
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {saved && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-xs text-emerald-400 flex items-center gap-2 zcode-fade-up">
                <Check className="w-3.5 h-3.5" />
                Paramètres sauvegardés.
              </div>
            )}
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
            onClick={save}
            disabled={saving || (provider.apiKeyRequired && !apiKey)}
            className="bg-brand hover:bg-brand-strong text-background"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Sauvegarde…
              </>
            ) : saved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Sauvegardé
              </>
            ) : (
              "Sauvegarder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
