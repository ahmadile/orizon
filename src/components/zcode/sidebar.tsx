"use client";

import * as React from "react";
import {
  Plus,
  Search,
  FolderGit2,
  MessageSquare,
  MoreHorizontal,
  GitBranch,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useZCode, PHASES } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import { RelativeTime } from "@/components/zcode/relative-time";
import { ZCodeLogo } from "@/components/zcode/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PHASE_LABEL: Record<string, string> = Object.fromEntries(
  PHASES.map((p) => [p.id, p.shortLabel])
);

const INTENT_LABEL: Record<string, string> = {
  improve: "Améliorer",
  derive: "Dériver",
  adapt: "Adapter",
};

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    newConversation,
    sidebarCollapsed,
    toggleSidebar,
  } = useZCode();
  const [query, setQuery] = React.useState("");

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.repoName.toLowerCase().includes(query.toLowerCase())
  );

  // Collapsed state — render a slim rail with just the logo + expand button
  if (sidebarCollapsed) {
    return (
      <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border items-center">
        {/* Header aligned with chat header (h-14) */}
        <div className="flex items-center justify-center h-14 w-full border-b border-sidebar-border shrink-0">
          <ZCodeLogo size={24} markOnly />
        </div>
        {/* Expand button */}
        <div className="p-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Afficher la barre latérale</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* New task (icon only) */}
        <div className="p-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => newConversation()}
                  className="h-9 w-9 bg-secondary hover:bg-secondary/80 border border-sidebar-border text-foreground"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Nouvelle tâche (⌘N)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* Footer avatar */}
        <div className="mt-auto p-2 border-t border-sidebar-border w-full flex justify-center">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/30 border border-border flex items-center justify-center text-[10px] font-medium text-foreground">
            R
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Brand header — h-14 to align with chat panel header */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-sidebar-border shrink-0">
        <ZCodeLogo size={26} />
        <div className="ml-auto flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={toggleSidebar}
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Réduire la barre latérale</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Paramètres</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* New task button */}
      <div className="p-3">
        <Button
          onClick={() => newConversation()}
          className="w-full justify-start gap-2 h-9 bg-secondary hover:bg-secondary/80 border border-sidebar-border text-foreground"
          variant="secondary"
        >
          <Plus className="w-4 h-4" />
          Nouvelle tâche
          <kbd className="ml-auto text-[10px] text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
            ⌘N
          </kbd>
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="h-8 pl-8 text-xs bg-background/40 border-sidebar-border"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto zcode-scroll px-2 pb-2">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
          <span>Tâches</span>
          <span className="text-muted-foreground/50">{filtered.length}</span>
        </div>
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveConversation(c.id)}
            className={cn(
              "group w-full text-left rounded-lg p-2 mb-0.5 transition-colors",
              c.id === activeConversationId
                ? "bg-sidebar-accent"
                : "hover:bg-sidebar-accent/60"
            )}
          >
            <div className="flex items-start gap-2">
              <FolderGit2
                className={cn(
                  "w-3.5 h-3.5 mt-0.5 shrink-0",
                  c.id === activeConversationId
                    ? "text-emerald-400"
                    : "text-muted-foreground"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-xs font-medium truncate flex-1",
                      c.id === activeConversationId
                        ? "text-foreground"
                        : "text-foreground/80"
                    )}
                  >
                    {c.repoName}
                  </span>
                  {c.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {c.title}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] uppercase tracking-wider bg-background/40 border border-sidebar-border px-1.5 py-0.5 rounded text-muted-foreground">
                    {PHASE_LABEL[c.phase]}
                  </span>
                  {c.intent && (
                    <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400">
                      {INTENT_LABEL[c.intent]}
                    </span>
                  )}
                  <RelativeTime
                    ts={c.lastActivity}
                    format="short"
                    className="text-[9px] text-muted-foreground/60 ml-auto"
                  />
                </div>
              </div>
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Footer — workspace info */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/30 border border-border flex items-center justify-center text-[10px] font-medium text-foreground">
            R
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-foreground text-xs font-medium truncate">
              Ryan Dev
            </div>
            <div className="flex items-center gap-1 truncate">
              <GitBranch className="w-2.5 h-2.5" />
              <span className="truncate">main · offline</span>
            </div>
          </div>
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
      </div>
    </aside>
  );
}
