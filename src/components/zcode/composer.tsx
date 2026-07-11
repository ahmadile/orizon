"use client";

import * as React from "react";
import { Paperclip, ArrowUp, Folder, FileText, Image as ImageIcon, X, Square } from "lucide-react";
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
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
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

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur px-4 py-3">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-1.5 text-xs bg-secondary border border-border rounded-md pl-2 pr-1 py-1"
            >
              {a.kind === "folder" ? (
                <Folder className="w-3 h-3 text-emerald-400" />
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
              className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-emerald-500/40 rounded-full px-2.5 py-1 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-card border border-border rounded-xl focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
        {/* Attach menu */}
        <div className="flex items-center gap-0.5 pl-2 pb-2 pt-2.5">
          <AttachMenu onAttach={onAttach} />
        </div>

        <Textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Demander à l'IA d'analyser, expliquer, transformer…"
          className="flex-1 min-h-[40px] max-h-[180px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/60 px-1 py-2.5"
          rows={1}
        />

        <div className="flex items-center gap-1 pr-2 pb-2 pt-2.5">
          <Button
            onClick={submit}
            disabled={!text.trim() || isAssistantTyping}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg shrink-0 transition-all",
              text.trim() && !isAssistantTyping
                ? "bg-emerald-500 hover:bg-emerald-600 text-background"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {isAssistantTyping ? (
              <Square className="w-3 h-3" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-muted-foreground/60">
          Entrée pour envoyer · Maj+Entrée pour un saut de ligne
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          <span className="text-emerald-400">●</span> GLM-5.2 orchestré
        </span>
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
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((o) => !o)}
        aria-label="Joindre"
      >
        <Paperclip className="w-3.5 h-3.5" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-1 z-50 bg-popover border border-border rounded-lg shadow-xl py-1 w-44 zcode-fade-up">
            <button
              onClick={() => {
                onAttach("folder");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
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
