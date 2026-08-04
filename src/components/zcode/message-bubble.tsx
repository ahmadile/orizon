"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import type { Message } from "@/lib/zcode/types";
import { User, Info } from "lucide-react";
import { AIBrandIcon } from "@/components/zcode/ai-brand-icon";
import { RelativeTime } from "@/components/zcode/relative-time";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center my-2 zcode-fade-up">
        <div className="flex items-start gap-2 max-w-[85%] text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand" />
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
            : "bg-brand-soft border border-brand"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-foreground" />
        ) : (
          <AIBrandIcon className="text-brand" size={15} />
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
              : message.error
              ? "bg-rose-500/5 border border-rose-500/20 rounded-tl-sm"
              : "bg-card border border-border rounded-tl-sm"
          )}
        >
          {/* Chain-of-thought shown while streaming (subtle, collapsible) */}
          {message.streaming && message.reasoning && (
            <div className="mb-2 pb-2 border-b border-border/50">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                raisonnement
              </div>
              <div className="text-[11px] text-muted-foreground/70 italic leading-relaxed max-h-24 overflow-y-auto zcode-scroll">
                {message.reasoning}
              </div>
            </div>
          )}

          {/* Tool calls — chips montrant les outils utilisés par l'agent */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-border/50">
              {message.toolCalls.map((tc, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border",
                    tc.status === "running"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : tc.status === "done"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  )}
                >
                  <span>🔧</span>
                  <span>{tc.name}</span>
                  {tc.status === "running" && (
                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {tc.status === "done" && (
                    <span className="text-emerald-400">✓</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Main content */}
          {message.content ? (
            <div className="zcode-prose">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.streaming && (
                <span className="inline-block w-1.5 h-3.5 bg-brand ml-0.5 align-text-bottom zcode-caret" />
              )}
            </div>
          ) : message.streaming ? (
            <div className="flex gap-1 items-center py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 zcode-pulse-soft" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 zcode-pulse-soft" style={{ animationDelay: "200ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 zcode-pulse-soft" style={{ animationDelay: "400ms" }} />
            </div>
          ) : null}

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
        <RelativeTime
          ts={message.timestamp}
          format="long"
          className="text-[10px] text-muted-foreground px-1"
        />
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 my-4 zcode-fade-up">
      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-brand-soft border border-brand">
        <AIBrandIcon className="text-brand" size={15} />
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
