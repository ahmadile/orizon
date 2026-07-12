import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/aionlabs/system-prompt";
import type { PhaseId } from "@/lib/zcode/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================================
// Multi-agent orchestration endpoint.
// Implements the pattern from OpenAI Agents SDK in TypeScript:
//   1. One agent per sequenced part (frontend, backend, API, config)
//   2. Each agent reads its zone and produces a focused summary
//   3. A coordinator agent fuses the per-part summaries into a synthesis
//
// This is the heart of Phase 1 (Comprehension) — it's what makes ZCode
// able to analyze larger repos without a single mega-prompt.
// =========================================================================

interface RequestBody {
  repoPath: string;
  parts: { id: string; name: string; kind: string; description: string; sampleFiles: string[] }[];
}

interface AgentSummary {
  partId: string;
  partName: string;
  kind: string;
  summary: string;
  responsibilities: string[];
  sensitiveAreas: string[];
}

async function loadProviderSettings() {
  const rows = await db.setting.findMany({
    where: { key: { in: ["provider", "api_key", "base_url", "model"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    apiKey: map.api_key ?? process.env.AIONLABS_API_KEY ?? "",
    baseUrl: map.base_url ?? process.env.AIONLABS_BASE_URL ?? "https://api.aionlabs.ai/v1",
    model: map.model ?? process.env.AIONLABS_MODEL ?? "aion-labs/aion-3.0",
  };
}

async function callAgent(
  systemPrompt: string,
  userPrompt: string,
  settings: { apiKey: string; baseUrl: string; model: string }
): Promise<string> {
  const res = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 800,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Agent call failed: ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { parts } = (await req.json()) as RequestBody;

    if (!Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { error: "parts array is required" },
        { status: 400 }
      );
    }

    const settings = await loadProviderSettings();

    if (!settings.apiKey && !settings.baseUrl.includes("localhost")) {
      return NextResponse.json(
        { error: "Aucune clé API configurée. Ouvrez les Paramètres." },
        { status: 401 }
      );
    }

    // Phase 1: Run one agent per part (in parallel for speed)
    const agentPromises = parts.map(async (part) => {
      const systemPrompt = `Tu es un agent spécialisé dans l'analyse de la couche « ${part.kind} » d'un projet logiciel.
Tu reçois une partie d'un dépôt (frontend, backend, API, config, etc.) et tu dois produire :
1. Un résumé concis (3-4 phrases) de ce que fait cette partie
2. Une liste de responsabilités (max 5)
3. Une liste de zones sensibles ou risquées (max 3)

Réponds en JSON strict :
{"summary": "...", "responsibilities": ["..."], "sensitiveAreas": ["..."]}`;

      const userPrompt = `Partie à analyser : ${part.name} (${part.kind})
Description : ${part.description}
Fichiers échantillons : ${part.sampleFiles.join(", ")}

Produis ton analyse au format JSON demandé.`;

      try {
        const response = await callAgent(systemPrompt, userPrompt, settings);
        // Try to parse JSON, fall back to plain text
        try {
          const parsed = JSON.parse(response);
          return {
            partId: part.id,
            partName: part.name,
            kind: part.kind,
            summary: parsed.summary ?? response,
            responsibilities: parsed.responsibilities ?? [],
            sensitiveAreas: parsed.sensitiveAreas ?? [],
          } as AgentSummary;
        } catch {
          return {
            partId: part.id,
            partName: part.name,
            kind: part.kind,
            summary: response.slice(0, 500),
            responsibilities: [],
            sensitiveAreas: [],
          } as AgentSummary;
        }
      } catch (err) {
        return {
          partId: part.id,
          partName: part.name,
          kind: part.kind,
          summary: `Erreur d'analyse: ${err instanceof Error ? err.message : "inconnue"}`,
          responsibilities: [],
          sensitiveAreas: [],
        } as AgentSummary;
      }
    });

    const summaries: AgentSummary[] = await Promise.all(agentPromises);

    // Phase 2: Coordinator agent fuses the summaries
    const coordinatorPrompt = `Tu es l'agent coordinateur de l'analyse multi-agents.
Voici les résumés produits par les agents spécialisés pour chaque partie du dépôt.
Produis une synthèse architecturale globale (5-7 phrases) qui explique comment les parties
interagissent, quels sont les points forts et les points d'attention.

Résumés des parties :
${summaries.map((s) => `### ${s.partName} (${s.kind})
${s.summary}
Responsabilités: ${s.responsibilities.join(", ")}
Zones sensibles: ${s.sensitiveAreas.join(", ")}`).join("\n\n")}`;

    const coordinatorSystem = "Tu es un architecte logiciel qui synthétise des analyses multi-agents en un résumé cohérent. Réponds en français, en 5-7 phrases maximum.";

    let synthesis = "";
    try {
      synthesis = await callAgent(coordinatorSystem, coordinatorPrompt, settings);
    } catch {
      synthesis = "Synthèse indisponible (erreur de l'agent coordinateur). Voir les résumés individuels ci-dessus.";
    }

    return NextResponse.json({
      summaries,
      synthesis,
      agentCount: summaries.length,
      model: settings.model,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Orchestration error" },
      { status: 500 }
    );
  }
}
