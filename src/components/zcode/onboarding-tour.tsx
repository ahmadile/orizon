"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector to highlight — null = centered modal */
  target?: string;
  /** placement relative to target */
  placement?: "bottom" | "top" | "left" | "right" | "center";
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bienvenue dans ZCode",
    body: "ZCode est une plateforme agentique qui comprend vos dépôts open source et vous accompagne pour les améliorer, les adapter ou en créer un dérivé. Suivez ce tour rapide de 30 secondes pour découvrir les fonctionnalités essentielles.",
    placement: "center",
  },
  {
    id: "sidebar",
    title: "Barre latérale — Vos tâches",
    body: "Retrouvez ici toutes vos conversations. Chaque tâche correspond à un dépôt analysé. Cliquez sur « Nouvelle tâche » pour repartir de zéro, ou « Ouvrir un dépôt » pour charger un dossier local.",
    target: '[data-tour="sidebar"]',
    placement: "right",
  },
  {
    id: "chat",
    title: "Chat central — Dialoguez avec l'IA",
    body: "Posez n'importe quelle question sur votre dépôt : architecture, code, tests, dépendances. L'IA répond en streaming avec des blocs de code colorés et une chaîne de raisonnement transparente.",
    target: '[data-tour="chat"]',
    placement: "bottom",
  },
  {
    id: "phases",
    title: "Les 5 phases du parcours",
    body: "ZCode suit un parcours structuré : Comprendre → Déclarer → Explorer → Maquetter → Produire. Chaque phase se débloque au fur et à mesure. Cliquez sur une phase pour y accéder directement.",
    target: '[data-tour="phases"]',
    placement: "bottom",
  },
  {
    id: "progress",
    title: "Panneau progression — Suivi en temps réel",
    body: "Suivez l'analyse en direct : 6 étapes animées, parties séquencées du projet (frontend, backend, API…), dépendances, et les skills IA actives pour cette session.",
    target: '[data-tour="progress"]',
    placement: "left",
  },
  {
    id: "settings",
    title: "Paramètres — Multi-provider",
    body: "ZCode supporte 3 providers : Aion Labs (cloud), OpenAI-compatible (votre endpoint), et Ollama (local, sans clé). Cliquez sur l'icône engrenage pour configurer votre provider.",
    target: '[data-tour="settings"]',
    placement: "bottom",
  },
  {
    id: "shortcuts",
    title: "Raccourcis clavier",
    body: "⌘N pour une nouvelle tâche, ⌘K pour la command palette (recherche rapide d'actions, conversations, phases). Ces raccourcis fonctionnent partout dans l'app.",
    placement: "center",
  },
];

interface OnboardingTourProps {
  /** key used to remember if the tour was completed */
  storageKey?: string;
}

export function OnboardingTour({ storageKey = "zcode-tour-done" }: OnboardingTourProps) {
  const [open, setOpen] = React.useState(false);
  const [stepIdx, setStepIdx] = React.useState(0);

  // Open on first visit
  React.useEffect(() => {
    try {
      const done = localStorage.getItem(storageKey);
      if (!done) {
        // Small delay so the page is fully laid out
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage not available
    }
  }, [storageKey]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
  };

  const next = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      close();
    }
  };

  const prev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  if (!open) return null;

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
        onClick={close}
      >
        {/* Modal */}
        <div
          className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-5 zcode-fade-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-3">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === stepIdx ? "w-6 bg-brand" : i < stepIdx ? "w-1.5 bg-brand/40" : "w-1.5 bg-border"
                )}
              />
            ))}
            <button
              onClick={close}
              className="ml-auto p-1 hover:bg-accent rounded"
              aria-label="Fermer le tour"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-brand" />
          </div>

          {/* Title + body */}
          <h3 className="text-base font-semibold mb-1.5">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {step.body}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Étape {stepIdx + 1} / {STEPS.length}
            </span>
            <div className="flex items-center gap-1.5">
              {stepIdx > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prev}
                  className="text-muted-foreground h-8"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                  Précédent
                </Button>
              )}
              <Button
                onClick={next}
                size="sm"
                className="bg-brand hover:bg-brand-strong text-background h-8"
              >
                {isLast ? "Terminer" : "Suivant"}
                {!isLast && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
