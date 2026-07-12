"use client";

import * as React from "react";
import {
  Paperclip,
  ArrowUp,
  Folder,
  FileText,
  Image as ImageIcon,
  X,
  Square,
  CornerDownLeft,
} from "lucide-react";
import { useZCode } from "@/lib/zcode/store";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "Explique-moi l'architecture",
  "Comment marche l'IA ?",
  "Montre-moi le code du moteur",
  "Quelles pistes d'amélioration ?",
];

export function Composer() {
  const {
    sendMessage,
    isAssistantTyping,
    attachments,
    attachFile,
    removeAttachment,
    comprehensionDone,
  } = useZCode();

  const [text, setText] = React.useState("");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [text]);

  const submit = () => {
    if (!text.trim() || isAssistantTyping) return;
    sendMessage(text.trim());
    setText("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onAttach = (kind: "file" | "folder" | "image") => {
    const names = {
      file: "package.json",
      folder: "src/engine/",
      image: "screenshot.png",
    };
    attachFile(names[kind], kind, kind === "image" ? "248 KB" : undefined);
  };

  const canSend = text.trim().length > 0 && !isAssistantTyping;

  return (
    <div className="bg-background px-4 py-3 shrink-0">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-1.5 text-xs bg-secondary border border-border rounded-md pl-2 pr-1 py-1"
            >
              {a.kind === "folder" ? (
                <Folder className="w-3 h-3 text-brand" />
              ) : a.kind === "image" ? (
                <ImageIcon className="w-3 h-3 text-sky-400" />
              ) : (
                <FileText className="w-3 h-3 text-amber-400" />
              )}
              <span className="text-foreground">{a.name}</span>
              {a.size && (
                <span className="text-muted-foreground text-[10px]">
                  {a.size}
                </span>
              )}
              <button
                onClick={() => removeAttachment(a.id)}
                className="ml-0.5 hover:bg-background/60 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestions (only when comprehension done and no text yet) */}
      {comprehensionDone && !text && !isAssistantTyping && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-brand rounded-full px-2.5 py-1 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer container — single rounded card with footer row */}
      <div className="rounded-xl border border-border bg-card focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-soft transition-all overflow-hidden">
        {/* Textarea row */}
        <Textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Demander à l'IA d'analyser, expliquer, transformer…"
          className="w-full min-h-[40px] max-h-[160px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/60 px-3 pt-2.5 pb-1"
          rows={1}
        />

        {/* Footer row — attach + hint on the left, model + send on the right */}
        <div className="flex items-center gap-2 px-2 pb-2 pt-1">
          <AttachMenu onAttach={onAttach} />

          {/* Hint */}
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <CornerDownLeft className="w-2.5 h-2.5" />
            <span>Entrée pour envoyer</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Maj+Entrée = saut de ligne</span>
          </span>

          {/* Right side: model badge + send button */}
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/60 border border-border rounded-md px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Aion-3.0
            </span>
            <Button
              onClick={submit}
              disabled={!canSend}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg shrink-0 transition-all",
                canSend
                  ? "bg-brand hover:bg-brand-strong text-background"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Envoyer"
            >
              {isAssistantTyping ? (
                <Square className="w-3 h-3" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttachMenu({
  onAttach,
}: {
  onAttach: (k: "file" | "folder" | "image") => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
        onClick={() => setOpen((o) => !o)}
        aria-label="Joindre"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-1.5 z-50 bg-popover border border-border rounded-lg shadow-2xl py-1 w-44 zcode-fade-up">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 border-b border-border mb-1">
              Joindre
            </div>
            <button
              onClick={() => {
                onAttach("folder");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <Folder className="w-3.5 h-3.5 text-brand" />
              Dossier
            </button>
            <button
              onClick={() => {
                onAttach("file");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Fichier isolé
            </button>
            <button
              onClick={() => {
                onAttach("image");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              Image
            </button>
          </div>
        </>
      )}
    </div>
  );
}
