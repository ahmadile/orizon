"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ZCodeLogoProps {
  size?: number;
  className?: string;
  /** When true, renders only the mark (no wordmark) — used in collapsed sidebar */
  markOnly?: boolean;
}

/**
 * ZCode brand mark — a refined monogram.
 *
 * Design rationale:
 * - Rounded square with subtle emerald gradient (consistent with the product accent)
 * - Custom "Z" glyph drawn with two angled strokes + a base bar, evoking
 *   both the letter Z and a code-bracket / flow shape
 * - Tight, geometric, no reliance on emoji or generic icon packs
 */
export function ZCodeLogo({ size = 28, className, markOnly = false }: ZCodeLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="zcode-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f5a524" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
        {/* Rounded square background */}
        <rect width="32" height="32" rx="8" fill="url(#zcode-grad)" />
        {/* Z monogram — two strokes + base, white, geometric */}
        <path
          d="M9 9.5 L23 9.5 L9 22.5 L23 22.5"
          stroke="#0a0a0a"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {!markOnly && (
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            ZCode
          </span>
          <span className="text-[9px] text-muted-foreground/80 mt-0.5">
            v1 · compréhension
          </span>
        </div>
      )}
    </div>
  );
}
