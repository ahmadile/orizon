"use client";

import { Sidebar } from "@/components/zcode/sidebar";
import { ChatPanel } from "@/components/zcode/chat-panel";
import { ProgressPanel } from "@/components/zcode/progress-panel";
import { CommandPalette } from "@/components/zcode/command-palette";
import { OnboardingTour } from "@/components/zcode/onboarding-tour";
import { useZCode } from "@/lib/zcode/store";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { sidebarCollapsed, progressCollapsed, hydrateFromDb } = useZCode();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Keyboard shortcuts: ⌘N (new), ⌘K (command palette)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        useZCode.getState().newConversation();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Hydrate conversations from the database on mount
  useEffect(() => {
    hydrateFromDb();
  }, [hydrateFromDb]);

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar — 260px expanded, 56px collapsed */}
      <div
        className={cn(
          "shrink-0 hidden md:block transition-[width] duration-200 ease-out",
          sidebarCollapsed ? "w-[56px]" : "w-[260px]"
        )}
      >
        <Sidebar
          onOpenRepo={() => setRepoDialogOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {/* Chat — flexible center */}
      <div className="flex-1 min-w-0">
        <ChatPanel
          externalRepoDialogOpen={repoDialogOpen}
          externalSettingsOpen={settingsOpen}
          onExternalRepoDialogChange={setRepoDialogOpen}
          onExternalSettingsChange={setSettingsOpen}
        />
      </div>

      {/* Progress — 320px expanded, 0 collapsed */}
      <div
        className={cn(
          "shrink-0 hidden lg:block transition-[width] duration-200 ease-out overflow-hidden",
          progressCollapsed ? "w-0" : "w-[320px]"
        )}
      >
        <ProgressPanel />
      </div>

      {/* Command palette (⌘K) */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenRepo={() => setRepoDialogOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Onboarding tour (first visit only) */}
      <OnboardingTour />
    </div>
  );
}
