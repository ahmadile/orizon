"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OrizonLogoProps {
  size?: number;
  className?: string;
  /** When true, renders only the mark (no wordmark) — used in collapsed sidebar */
  markOnly?: boolean;
}

/**
 * Orizon brand mark — a refined monogram.
 *
 * Design rationale:
 * - Rounded square with subtle amber gradient (consistent with the product accent)
 * - Custom "O" glyph drawn as a ring with a horizon line across the middle,
 *   evoking the letter O and the word "Orizon" (horizon)
 * - Tight, geometric, no reliance on emoji or generic icon packs
 */
export function OrizonLogo({ size = 28, className, markOnly = false }: OrizonLogoProps) {
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
        suppressHydrationWarning
      >
        <defs>
          <linearGradient id="orizon-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f5a524" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
        {/* Rounded square background */}
        <rect width="32" height="32" rx="8" fill="url(#orizon-grad)" />
        {/* O monogram — ring + horizon line, dark, geometric */}
        <circle
          cx="16"
          cy="16"
          r="7"
          stroke="#0a0a0a"
          strokeWidth="2.4"
          fill="none"
        />
        <path
          d="M9 16 L23 16"
          stroke="#0a0a0a"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      {!markOnly && (
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            Orizon
          </span>
          <span className="text-[9px] text-muted-foreground/80 mt-0.5">
            v1 · laboratoire
          </span>
        </div>
      )}
    </div>
  );
}
