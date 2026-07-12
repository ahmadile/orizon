"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FilePlus, FileMinus, Plus, Minus, FileCode2 } from "lucide-react";

// =========================================================================
// DiffView — renders a code diff GitHub-PR-style:
//   - green background for added lines (+)
//   - red background for removed lines (-)
//   - neutral for context lines
// =========================================================================

export interface DiffFile {
  filename: string;
  language: string;
  hunks: DiffLine[];
  newFile?: boolean;
  deletedFile?: boolean;
}

export interface DiffLine {
  type: "add" | "del" | "context" | "hunk-header";
  oldLine?: number;
  newLine?: number;
  content: string;
}

interface DiffViewProps {
  files: DiffFile[];
  /** total additions across all files */
  additions?: number;
  /** total deletions across all files */
  deletions?: number;
}

export function DiffView({ files, additions, deletions }: DiffViewProps) {
  const totalAdd = additions ?? files.reduce(
    (s, f) => s + f.hunks.filter((h) => h.type === "add").length,
    0
  );
  const totalDel = deletions ?? files.reduce(
    (s, f) => s + f.hunks.filter((h) => h.type === "del").length,
    0
  );

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Header — summary */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-secondary/30">
        <span className="text-xs font-semibold">Diff proposé</span>
        <span className="text-[10px] text-muted-foreground">
          {files.length} fichier{files.length > 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-2 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-add">
            <Plus className="w-3 h-3" />
            {totalAdd}
          </span>
          <span className="flex items-center gap-1 text-del">
            <Minus className="w-3 h-3" />
            {totalDel}
          </span>
        </div>
      </div>

      {/* Files */}
      <div className="divide-y divide-border">
        {files.map((f, i) => (
          <DiffFileBlock key={i} file={f} />
        ))}
      </div>
    </div>
  );
}

function DiffFileBlock({ file }: { file: DiffFile }) {
  const [expanded, setExpanded] = React.useState(true);

  const fileAdd = file.hunks.filter((h) => h.type === "add").length;
  const fileDel = file.hunks.filter((h) => h.type === "del").length;

  return (
    <div>
      {/* File header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/30 transition-colors text-left"
      >
        {file.newFile ? (
          <FilePlus className="w-3.5 h-3.5 text-add shrink-0" />
        ) : file.deletedFile ? (
          <FileMinus className="w-3.5 h-3.5 text-del shrink-0" />
        ) : (
          <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-mono text-foreground truncate flex-1">
          {file.filename}
          {file.newFile && (
            <span className="ml-2 text-[9px] uppercase bg-add-soft text-add border border-add px-1 py-0.5 rounded">
              nouveau
            </span>
          )}
          {file.deletedFile && (
            <span className="ml-2 text-[9px] uppercase bg-rose-500/10 text-del border border-rose-500/20 px-1 py-0.5 rounded">
              supprimé
            </span>
          )}
        </span>
        <span className="text-[10px] font-mono text-add flex items-center gap-0.5">
          +{fileAdd}
        </span>
        <span className="text-[10px] font-mono text-del flex items-center gap-0.5">
          −{fileDel}
        </span>
      </button>

      {/* Diff content */}
      {expanded && (
        <div className="overflow-x-auto zcode-scroll bg-[#0d0d0d] border-t border-border">
          <pre className="text-[11px] leading-relaxed font-mono">
            {file.hunks.map((line, i) => (
              <DiffLineRow key={i} line={line} />
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  if (line.type === "hunk-header") {
    return (
      <div className="px-3 py-1 bg-sky-500/5 text-sky-400/80 text-[10px] border-y border-sky-500/10">
        {line.content}
      </div>
    );
  }

  const prefix = line.type === "add" ? "+" : line.type === "del" ? "−" : " ";
  const oldLine = line.oldLine ?? "";
  const newLine = line.newLine ?? "";

  return (
    <div
      className={cn(
        "flex items-start hover:bg-white/[0.02]",
        line.type === "add" && "bg-emerald-500/[0.08]",
        line.type === "del" && "bg-rose-500/[0.08]"
      )}
    >
      {/* line numbers */}
      <span className="select-none w-10 text-right pr-2 text-muted-foreground/40 shrink-0 border-r border-border/50">
        {oldLine}
      </span>
      <span className="select-none w-10 text-right pr-2 text-muted-foreground/40 shrink-0 border-r border-border/50">
        {newLine}
      </span>
      {/* prefix */}
      <span
        className={cn(
          "select-none w-5 text-center shrink-0",
          line.type === "add" && "text-add",
          line.type === "del" && "text-del",
          line.type === "context" && "text-muted-foreground/40"
        )}
      >
        {prefix}
      </span>
      {/* content */}
      <code
        className={cn(
          "px-1 whitespace-pre",
          line.type === "add" && "text-add",
          line.type === "del" && "text-del",
          line.type === "context" && "text-muted-foreground"
        )}
      >
        {line.content || " "}
      </code>
    </div>
  );
}

// =========================================================================
// Mock diff data — example transformation for the gomoku-ai project
// =========================================================================

export const MOCK_DIFF: DiffFile[] = [
  {
    filename: "src/ai/Minimax.ts",
    language: "typescript",
    hunks: [
      { type: "hunk-header", content: "@@ -1,7 +1,9 @@", oldLine: 1, newLine: 1 },
      { type: "context", oldLine: 1, newLine: 1, content: "import { Board } from '../engine/Board';" },
      { type: "context", oldLine: 2, newLine: 2, content: "import { Heuristic } from './Heuristic';" },
      { type: "context", oldLine: 3, newLine: 3, content: "" },
      { type: "del", oldLine: 4, newLine: undefined, content: "export function minimax(board: Board, depth: number) {" },
      { type: "add", oldLine: undefined, newLine: 4, content: "export function minimax(board: Board, depth: number, budget = 300) {" },
      { type: "add", oldLine: undefined, newLine: 5, content: "  const startTime = Date.now();" },
      { type: "context", oldLine: 5, newLine: 6, content: "  if (depth === 0 || board.isTerminal()) {" },
      { type: "context", oldLine: 6, newLine: 7, content: "    return Heuristic.evaluate(board);" },
      { type: "context", oldLine: 7, newLine: 8, content: "  }" },
      { type: "hunk-header", content: "@@ -12,6 +14,12 @@", oldLine: 12, newLine: 14 },
      { type: "context", oldLine: 12, newLine: 14, content: "  for (const m of moves) {" },
      { type: "context", oldLine: 13, newLine: 15, content: "    board.play(m);" },
      { type: "add", oldLine: undefined, newLine: 16, content: "    if (Date.now() - startTime > budget) {" },
      { type: "add", oldLine: undefined, newLine: 17, content: "      board.undo(m);" },
      { type: "add", oldLine: undefined, newLine: 18, content: "      break; // budget exhausted — return best so far" },
      { type: "add", oldLine: undefined, newLine: 19, content: "    }" },
      { type: "context", oldLine: 14, newLine: 20, content: "    best = Math.max(best, minimax(board, depth - 1, budget));" },
      { type: "context", oldLine: 15, newLine: 21, content: "    board.undo(m);" },
      { type: "context", oldLine: 16, newLine: 22, content: "  }" },
    ],
  },
  {
    filename: "src/ai/Heuristic.ts",
    language: "typescript",
    hunks: [
      { type: "hunk-header", content: "@@ -8,4 +8,8 @@", oldLine: 8, newLine: 8 },
      { type: "context", oldLine: 8, newLine: 8, content: "  static evaluate(board: Board): number {" },
      { type: "context", oldLine: 9, newLine: 9, content: "    let score = 0;" },
      { type: "del", oldLine: 10, newLine: undefined, content: "    score += this.countOpenThrees(board) * 10;" },
      { type: "add", oldLine: undefined, newLine: 10, content: "    score += this.countOpenThrees(board) * 100; // bumped weight" },
      { type: "add", oldLine: undefined, newLine: 11, content: "    score += this.countDoubleThrees(board) * 500; // new pattern" },
      { type: "context", oldLine: 11, newLine: 12, content: "    return score;" },
      { type: "context", oldLine: 12, newLine: 13, content: "  }" },
    ],
  },
  {
    filename: "tests/Minimax.test.ts",
    language: "typescript",
    newFile: true,
    hunks: [
      { type: "hunk-header", content: "@@ -0,0 +1,18 @@", oldLine: undefined, newLine: 1 },
      { type: "add", oldLine: undefined, newLine: 1, content: "import { describe, it, expect } from 'vitest';" },
      { type: "add", oldLine: undefined, newLine: 2, content: "import { minimax } from '../src/ai/Minimax';" },
      { type: "add", oldLine: undefined, newLine: 3, content: "import { Board } from '../src/engine/Board';" },
      { type: "add", oldLine: undefined, newLine: 4, content: "" },
      { type: "add", oldLine: undefined, newLine: 5, content: "describe('minimax with budget', () => {" },
      { type: "add", oldLine: undefined, newLine: 6, content: "  it('respects the time budget', () => {" },
      { type: "add", oldLine: undefined, newLine: 7, content: "    const board = new Board();" },
      { type: "add", oldLine: undefined, newLine: 8, content: "    const start = Date.now();" },
      { type: "add", oldLine: undefined, newLine: 9, content: "    minimax(board, 6, 200);" },
      { type: "add", oldLine: undefined, newLine: 10, content: "    const elapsed = Date.now() - start;" },
      { type: "add", oldLine: undefined, newLine: 11, content: "    expect(elapsed).toBeLessThan(300);" },
      { type: "add", oldLine: undefined, newLine: 12, content: "  });" },
      { type: "add", oldLine: undefined, newLine: 13, content: "" },
      { type: "add", oldLine: undefined, newLine: 14, content: "  it('returns a finite score', () => {" },
      { type: "add", oldLine: undefined, newLine: 15, content: "    const board = new Board();" },
      { type: "add", oldLine: undefined, newLine: 16, content: "    const score = minimax(board, 2);" },
      { type: "add", oldLine: undefined, newLine: 17, content: "    expect(Number.isFinite(score)).toBe(true);" },
      { type: "add", oldLine: undefined, newLine: 18, content: "  });" },
      { type: "add", oldLine: undefined, newLine: 18, content: "});" },
    ],
  },
];
