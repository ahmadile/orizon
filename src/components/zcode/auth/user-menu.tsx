"use client";

import * as React from "react";
import { useZCode } from "@/lib/zcode/store";
import { AuthDialog } from "./auth-dialog";
import { cn } from "@/lib/utils";
import {
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export function UserMenu() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Fetch the current session on mount
  React.useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ callbackUrl: "/", json: "true" }),
    });
    setUser(null);
    setMenuOpen(false);
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="border-t border-sidebar-border p-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Chargement…</span>
      </div>
    );
  }

  // Not logged in — show sign-in button
  if (!user) {
    return (
      <>
        <div className="border-t border-sidebar-border p-3">
          <Button
            onClick={() => setAuthOpen(true)}
            className="w-full justify-center gap-2 h-9 bg-brand hover:bg-brand-strong text-background"
          >
            <LogIn className="w-3.5 h-3.5" />
            Se connecter
          </Button>
          <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
            Sauvegardez vos conversations
          </p>
        </div>
        <AuthDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          onAuthed={() => {
            // The dialog handles the reload
          }}
        />
      </>
    );
  }

  // Logged in — show user info + sign-out menu
  const initials = (user.name ?? user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <>
      <div className="border-t border-sidebar-border p-3 relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-full flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-brand-strong border border-border flex items-center justify-center text-[10px] font-semibold text-background shrink-0">
            {initials || <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-foreground text-xs font-medium truncate">
              {user.name ?? user.email.split("@")[0]}
            </div>
            <div className="truncate text-[10px]">{user.email}</div>
          </div>
          <ChevronUp
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              !menuOpen && "rotate-180"
            )}
          />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute bottom-full left-3 right-3 mb-1 z-50 bg-popover border border-border rounded-lg shadow-2xl py-1 zcode-fade-up">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs font-medium text-foreground truncate">
                  {user.name ?? "Utilisateur"}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left text-rose-400"
              >
                <LogOut className="w-3.5 h-3.5" />
                Se déconnecter
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
