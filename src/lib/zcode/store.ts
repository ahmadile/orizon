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
import { streamChat as sseStreamChat } from "./sse-client";
import {
  listConversations,
  createConversation,
  appendMessage,
  updateConversation,
} from "./persist";

interface ZCodeState {
  // conversations
  conversations: Conversation[];
  activeConversationId: string;
  /** Prisma DB id of the active conversation (null = not yet persisted) */
  dbConversationId: string | null;

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

  // layout
  sidebarCollapsed: boolean;
  progressCollapsed: boolean;

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
  toggleSidebar: () => void;
  toggleProgress: () => void;

  // persistence
  hydrateFromDb: () => Promise<void>;
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
  dbConversationId: null,

  steps: INITIAL_STEPS.map((s) => ({ ...s })),
  comprehensionDone: false,
  comprehensionRunning: false,

  messages: INITIAL_MESSAGES,
  isAssistantTyping: false,
  attachments: [],

  phase: "comprehension",
  intent: null,
  sidebarCollapsed: false,
  progressCollapsed: false,

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

    // Create a conversation in the DB if we don't have one yet
    if (!get().dbConversationId) {
      createConversation({
        title: `${MOCK_REPO.name} — compréhension`,
        repoPath: MOCK_REPO.path,
        repoName: MOCK_REPO.name,
        phase: "comprehension",
      }).then((id) => {
        if (id) set({ dbConversationId: id });
      });
    }

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

    // Build the conversation history for the API (exclude system messages
    // — the system prompt is added server-side)
    const history = [...get().messages, userMsg]
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    set((s) => ({
      messages: [...s.messages, userMsg],
      attachments: [],
      isAssistantTyping: true,
    }));

    // Persist the user message (fire-and-forget)
    const dbId = get().dbConversationId;
    if (dbId) {
      appendMessage(dbId, {
        role: "user",
        content: text,
        attachments: userMsg.attachments as unknown as { id: string; name: string; kind: string }[] | undefined,
      });
    }

    // Create a placeholder assistant message that we'll update as chunks arrive
    const assistantId = nextMsgId();
    const placeholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      reasoning: "",
      timestamp: Date.now(),
      streaming: true,
    };
    set((s) => ({ messages: [...s.messages, placeholder] }));

    // Stream from the real API
    sseStreamChat(history, {
      onReasoning: (chunk) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId
              ? { ...m, reasoning: (m.reasoning ?? "") + chunk }
              : m
          ),
        }));
      },
      onContent: (chunk) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m
          ),
        }));
      },
      onDone: () => {
        const finalContent = get().messages.find((m) => m.id === assistantId)?.content ?? "";
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  streaming: false,
                  // clear reasoning once the answer is complete (it's noise)
                  reasoning: undefined,
                }
              : m
          ),
          isAssistantTyping: false,
        }));
        // Persist the assistant's final answer
        if (dbId && finalContent) {
          appendMessage(dbId, { role: "assistant", content: finalContent });
        }
      },
      onError: (errMsg) => {
        // Fallback to canned answer so the demo stays functional
        const fallback = findCannedAnswer(text);
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    fallback.content +
                    `\n\n---\n*⚠️ Erreur API (${errMsg}). Réponse de fallback.*`,
                  codeBlocks: fallback.codeBlocks,
                  refPartId: fallback.refPartId,
                  streaming: false,
                  reasoning: undefined,
                  error: true,
                }
              : m
          ),
          isAssistantTyping: false,
        }));
      },
    });
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
    const dbId = get().dbConversationId;
    if (dbId) updateConversation(dbId, { phase: p });
  },

  setIntent: (i) => {
    set({ intent: i });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === s.activeConversationId ? { ...c, intent: i } : c
      ),
    }));
    const dbId = get().dbConversationId;
    if (dbId) updateConversation(dbId, { intent: i });
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
  },

  toggleProgress: () => {
    set((s) => ({ progressCollapsed: !s.progressCollapsed }));
  },

  hydrateFromDb: async () => {
    const rows = await listConversations();
    if (rows.length === 0) return;

    // Merge DB conversations into the store (DB takes priority)
    const dbConvs: Conversation[] = rows.map((r) => ({
      id: `db_${r.id}`,
      title: r.title,
      repoPath: "~/projects",
      repoName: r.title.split("—")[0]?.trim() ?? r.title,
      phase: r.phase as PhaseId,
      intent: r.intent as Intent,
      lastActivity: new Date(r.lastActivity).getTime(),
      active: false,
    }));

    set((s) => ({
      conversations: [...dbConvs, ...s.conversations.filter((c) => !c.id.startsWith("db_"))],
    }));
  },
}));

export { PHASES, MOCK_REPO, MOCKUP_VARIANTS };
