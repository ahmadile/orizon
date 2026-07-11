"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import type { Message } from "@/lib/zcode/types";
import { User, Sparkles, Info } from "lucide-react";
import { timeAgo } from "@/lib/zcode/utils";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center my-2 zcode-fade-up">
        <div className="flex items-start gap-2 max-w-[85%] text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
          <div className="zcode-prose text-muted-foreground">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 my-4 zcode-fade-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          isUser
            ? "bg-secondary border border-border"
            : "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-foreground" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[78%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-secondary text-foreground rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm"
          )}
        >
          <div className="zcode-prose">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {message.codeBlocks?.map((cb, i) => (
            <CodeBlock
              key={i}
              code={cb.code}
              language={cb.language}
              filename={cb.filename}
            />
          ))}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {message.attachments.map((a) => (
                <span
                  key={a.id}
                  className="text-xs bg-background/60 border border-border rounded px-1.5 py-0.5"
                >
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {timeAgo(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 my-4 zcode-fade-up">
      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 zcode-pulse-soft" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 zcode-pulse-soft" style={{ animationDelay: "200ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 zcode-pulse-soft" style={{ animationDelay: "400ms" }} />
          <span className="text-xs text-muted-foreground ml-2">analyse en cours…</span>
        </div>
      </div>
    </div>
  );
}
