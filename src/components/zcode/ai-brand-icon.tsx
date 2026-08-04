"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AIBrandIconProps {
  className?: string;
  size?: number;
}

/**
 * AIBrandIcon — a custom, distinctive mark for Orizon's AI agent.
 *
 * Design rationale:
 * - NOT a generic sparkles/star (overused on AI-generated sites)
 * - Represents an "orchestration node": a central core with three orbiting
 *   satellites, evoking multi-agent coordination (the product's core concept)
 * - Geometric, geometric, recognizable at small sizes (16px+)
 * - Single-stroke style, inherits currentColor
 */
export function AIBrandIcon({ className, size = 16 }: AIBrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Central core */}
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      {/* Three orbiting nodes — triangle arrangement, multi-agent symbol */}
      <circle cx="12" cy="4" r="1.6" fill="currentColor" />
      <circle cx="4.5" cy="15.5" r="1.6" fill="currentColor" />
      <circle cx="19.5" cy="15.5" r="1.6" fill="currentColor" />
      {/* Connection lines — orchestration links */}
      <path
        d="M12 7 L12 9 M6.6 13.8 L9.5 12.5 M17.4 13.8 L14.5 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}
