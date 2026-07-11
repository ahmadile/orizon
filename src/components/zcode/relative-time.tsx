"use client";

import * as React from "react";
import { timeAgo, formatRelativeShort } from "@/lib/zcode/utils";

interface RelativeTimeProps {
  ts: number;
  format?: "long" | "short";
  className?: string;
  /**
   * Optional placeholder rendered during SSR and before mount.
   * Defaults to a non-breaking space so the span keeps its layout.
   */
  placeholder?: string;
}

/**
 * Renders a relative time string ("now", "5m", "il y a 3 min", …).
 *
 * IMPORTANT — hydration safety:
 * The relative time is computed from Date.now() which differs between
 * server render and client hydration (the dev server caches the module,
 * so the captured timestamp drifts). To avoid hydration mismatches, we
 * render a stable placeholder on the server and only compute the real
 * value after mount on the client.
 */
export function RelativeTime({
  ts,
  format = "short",
  className,
  placeholder = "\u00A0",
}: RelativeTimeProps) {
  const [mounted, setMounted] = React.useState(false);
  const [text, setText] = React.useState(placeholder);

  React.useEffect(() => {
    setMounted(true);
    const update = () => {
      setText(format === "long" ? timeAgo(ts) : formatRelativeShort(ts));
    };
    update();
    // refresh every 30s so "il y a 2 min" stays roughly accurate
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, [ts, format]);

  if (!mounted) {
    return (
      <span className={className} aria-hidden="true">
        {placeholder}
      </span>
    );
  }

  return (
    <span className={className} title={new Date(ts).toLocaleString("fr-FR")}>
      {text}
    </span>
  );
}
