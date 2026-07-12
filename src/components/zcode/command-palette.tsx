"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FolderOpen,
  Plus,
  Settings,
  PanelLeftClose,
  PanelRightClose,
  Play,
  Target,
  FlaskConical,
  LayoutTemplate,
  FileCode2,
  Search,
  GitBranch,
  MessageSquare,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useZCode, PHASES } from "@/lib/zcode/store";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenRepo: () => void;
  onOpenSettings: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenRepo,
  onOpenSettings,
}: CommandPaletteProps) {
  const {
    conversations,
    setActiveConversation,
    newConversation,
    setPhase,
    toggleSidebar,
    toggleProgress,
    startComprehension,
    resetComprehension,
    comprehensionDone,
    hasRepo,
    phase,
  } = useZCode();

  const run = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une action, une conversation, une phase…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => run(() => onOpenRepo())}
            className="cursor-pointer"
          >
            <FolderOpen className="mr-2 h-4 w-4 text-brand" />
            <span>Ouvrir un dépôt</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => newConversation())}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouvelle tâche</span>
            <kbd className="ml-auto text-[10px] text-muted-foreground">⌘N</kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => onOpenSettings())}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres — Provider IA</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Phases — only shown when a repo is loaded */}
        {hasRepo && (
          <>
            <CommandGroup heading="Phases du parcours">
              {PHASES.map((p) => {
                const icons: Record<string, React.ElementType> = {
                  comprehension: Search,
                  intention: Target,
                  experimentation: FlaskConical,
                  maquette: LayoutTemplate,
                  generation: FileCode2,
                };
                const Icon = icons[p.id];
                const isLocked = p.id !== "comprehension" && !comprehensionDone;
                return (
                  <CommandItem
                    key={p.id}
                    disabled={isLocked}
                    onSelect={() => run(() => setPhase(p.id))}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{p.label}</span>
                    {phase === p.id && (
                      <span className="ml-auto text-[10px] text-brand">actuelle</span>
                    )}
                    {isLocked && (
                      <span className="ml-auto text-[10px] text-muted-foreground">verrouillée</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Compréhension">
              {!comprehensionDone && (
                <CommandItem
                  onSelect={() => run(() => startComprehension())}
                  className="cursor-pointer"
                >
                  <Play className="mr-2 h-4 w-4 text-brand" />
                  <span>Lancer l'analyse</span>
                </CommandItem>
              )}
              {comprehensionDone && (
                <CommandItem
                  onSelect={() => run(() => resetComprehension())}
                  className="cursor-pointer"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Relancer l'analyse</span>
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />
          </>
        )}

        {/* Conversations */}
        {conversations.length > 0 && (
          <>
            <CommandGroup heading={`Conversations (${conversations.length})`}>
              {conversations.slice(0, 8).map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => run(() => setActiveConversation(c.id))}
                  className="cursor-pointer"
                >
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{c.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {c.repoName}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Layout */}
        <CommandGroup heading="Affichage">
          <CommandItem
            onSelect={() => run(() => toggleSidebar())}
            className="cursor-pointer"
          >
            <PanelLeftClose className="mr-2 h-4 w-4" />
            <span>Basculer la barre latérale</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => toggleProgress())}
            className="cursor-pointer"
          >
            <PanelRightClose className="mr-2 h-4 w-4" />
            <span>Basculer le panneau progression</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
