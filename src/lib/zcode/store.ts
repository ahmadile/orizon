"use client";

import { create } from "zustand";
import type {
  PhaseId,
  ComprehensionStep,
  Message,
  Conversation,
  Intent,
  Attachment,
} from "./types";
import {
  PHASES,
  INITIAL_STEPS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  MOCK_REPO,
  MOCKUP_VARIANTS,
  CANNED_ANSWERS,
  DEFAULT_ANSWER,
} from "./mock-data";

interface ZCodeState {
  // conversations
  conversations: Conversation[];
  activeConversationId: string;

  // comprehension
  steps: ComprehensionStep[];
  comprehensionDone: boolean;
  comprehensionRunning: boolean;

  // chat
  messages: Message[];
  isAssistantTyping: boolean;
  attachments: Attachment[];

  // journey
  phase: PhaseId;
  intent: Intent;

  // actions
  setActiveConversation: (id: string) => void;
  newConversation: (repoPath?: string) => void;

  startComprehension: () => void;
  resetComprehension: () => void;

  sendMessage: (text: string) => void;
  attachFile: (name: string, kind: Attachment["kind"], size?: string) => void;
  removeAttachment: (id: string) => void;

  setPhase: (p: PhaseId) => void;
  setIntent: (i: Intent) => void;
}

let msgIdCounter = 100;
const nextMsgId = () => `m${++msgIdCounter}`;
let attachIdCounter = 0;
const nextAttachId = () => `a${++attachIdCounter}`;

function findCannedAnswer(text: string) {
  for (const a of CANNED_ANSWERS) {
    if (a.match.test(text)) return a;
  }
  return DEFAULT_ANSWER;
}

export const useZCode = create<ZCodeState>((set, get) => ({
  conversations: INITIAL_CONVERSATIONS,
  activeConversationId: INITIAL_CONVERSATIONS[0].id,

  steps: INITIAL_STEPS.map((s) => ({ ...s })),
  comprehensionDone: false,
  comprehensionRunning: false,

  messages: INITIAL_MESSAGES,
  isAssistantTyping: false,
  attachments: [],

  phase: "comprehension",
  intent: null,

  setActiveConversation: (id) => {
    set((s) => ({
      conversations: s.conversations.map((c) => ({
        ...c,
        active: c.id === id,
        unread: c.id === id ? false : c.unread,
      })),
      activeConversationId: id,
    }));
  },

  newConversation: (repoPath) => {
    const id = `c${Date.now()}`;
    const conv: Conversation = {
      id,
      title: repoPath
        ? `${repoPath.split("/").pop()} — nouvelle session`
        : "Nouvelle session",
      repoPath: repoPath ?? "~",
      repoName: repoPath?.split("/").pop() ?? "dépôt",
      phase: "comprehension",
      intent: null,
      lastActivity: Date.now(),
      active: true,
    };
    set((s) => ({
      conversations: [
        conv,
        ...s.conversations.map((c) => ({ ...c, active: false })),
      ],
      activeConversationId: id,
      messages: [
        {
          id: nextMsgId(),
          role: "system",
          content: repoPath
            ? `Dépôt **${conv.repoName}** chargé depuis \`${repoPath}\`. Prêt à lancer l'analyse.`
            : "Nouvelle session. Attachez un dossier de dépôt pour démarrer.",
          timestamp: Date.now(),
        },
      ],
      steps: INITIAL_STEPS.map((st) => ({ ...st, status: "pending" as const })),
      comprehensionDone: false,
      comprehensionRunning: false,
      phase: "comprehension",
      intent: null,
    }));
  },

  startComprehension: () => {
    if (get().comprehensionRunning || get().comprehensionDone) return;
    set({ comprehensionRunning: true });

    const steps = get().steps;
    let idx = 0;

    const runNext = () => {
      if (idx >= steps.length) {
        set({ comprehensionRunning: false, comprehensionDone: true });
        // post the summary message
        const summary: Message = {
          id: nextMsgId(),
          role: "assistant",
          content:
            "✅ **Analyse terminée.** Voici ce que j'ai compris de **gomoku-ai** :\n\n" +
            `**${MOCK_REPO.description}**\n\n` +
            `**Stack** : ${MOCK_REPO.languages
              .map((l) => `${l.name} (${l.pct}%)`)
              .join(", ")}.\n\n` +
            `**Architecture** : ${MOCK_REPO.architecture}\n\n` +
            `**${MOCK_REPO.parts.length} parties séquencées** :\n` +
            MOCK_REPO.parts
              .map((p) => `- **${p.name}** — ${p.description.slice(0, 80)}…`)
              .join("\n") +
            "\n\nPosez-moi vos questions, ou passons à la **Phase 2** pour déclarer votre intention.",
          timestamp: Date.now(),
        };
        set((s) => ({ messages: [...s.messages, summary] }));
        return;
      }
      // mark current step running
      set((s) => ({
        steps: s.steps.map((st, i) =>
          i === idx ? { ...st, status: "running" } : st
        ),
      }));
      const step = steps[idx];
      window.setTimeout(() => {
        set((s) => ({
          steps: s.steps.map((st, i) =>
            i === idx ? { ...st, status: "completed" } : st
          ),
        }));
        idx++;
        runNext();
      }, step.durationMs);
    };
    runNext();
  },

  resetComprehension: () => {
    set({
      steps: INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })),
      comprehensionDone: false,
      comprehensionRunning: false,
    });
  },

  sendMessage: (text) => {
    const userMsg: Message = {
      id: nextMsgId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
      attachments: get().attachments.length
        ? [...get().attachments]
        : undefined,
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      attachments: [],
      isAssistantTyping: true,
    }));

    const answer = findCannedAnswer(text);
    // simulate "thinking" delay proportional to answer length
    const delay = Math.min(1800, 500 + answer.content.length * 4);

    window.setTimeout(() => {
      const assistantMsg: Message = {
        id: nextMsgId(),
        role: "assistant",
        content: answer.content,
        timestamp: Date.now(),
        codeBlocks: answer.codeBlocks,
        refPartId: answer.refPartId,
      };
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isAssistantTyping: false,
      }));
    }, delay);
  },

  attachFile: (name, kind, size) => {
    const att: Attachment = {
      id: nextAttachId(),
      name,
      kind,
      size,
    };
    set((s) => ({ attachments: [...s.attachments, att] }));
  },

  removeAttachment: (id) => {
    set((s) => ({
      attachments: s.attachments.filter((a) => a.id !== id),
    }));
  },

  setPhase: (p) => {
    set({ phase: p });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === s.activeConversationId ? { ...c, phase: p } : c
      ),
    }));
  },

  setIntent: (i) => {
    set({ intent: i });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === s.activeConversationId ? { ...c, intent: i } : c
      ),
    }));
  },
}));

export { PHASES, MOCK_REPO, MOCKUP_VARIANTS };
