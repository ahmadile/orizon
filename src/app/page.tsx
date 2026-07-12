"use client";

import { Sidebar } from "@/components/zcode/sidebar";
import { ChatPanel } from "@/components/zcode/chat-panel";
import { ProgressPanel } from "@/components/zcode/progress-panel";
import { useZCode } from "@/lib/zcode/store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { sidebarCollapsed, progressCollapsed, hydrateFromDb } = useZCode();

  // Keyboard shortcut: ⌘N / Ctrl+N for new conversation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        useZCode.getState().newConversation();
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
        <Sidebar />
      </div>

      {/* Chat — flexible center */}
      <div className="flex-1 min-w-0">
        <ChatPanel />
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
    </div>
  );
}
