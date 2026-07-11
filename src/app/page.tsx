"use client";

import { Sidebar } from "@/components/zcode/sidebar";
import { ChatPanel } from "@/components/zcode/chat-panel";
import { ProgressPanel } from "@/components/zcode/progress-panel";
import { useZCode } from "@/lib/zcode/store";
import { useEffect } from "react";

export default function Home() {
  const { conversations, activeConversationId } = useZCode();

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

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar — 260px fixed (matches spec §4) */}
      <div className="w-[260px] shrink-0 hidden md:block">
        <Sidebar />
      </div>

      {/* Chat — flexible center */}
      <div className="flex-1 min-w-0">
        <ChatPanel />
      </div>

      {/* Progress — 320px fixed (matches spec §4) */}
      <div className="w-[320px] shrink-0 hidden lg:block">
        <ProgressPanel />
      </div>
    </div>
  );
}
