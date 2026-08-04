import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeProject } from "@/lib/orizon/analyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/analyze — analyse un projet à un chemin donné
export async function POST(req: NextRequest) {
  try {
    const { path: projectPath, agentic } = await req.json() as {
      path: string;
      /** Inclure l'analyse agentique (LLM) */
      agentic?: boolean;
    };

    if (!projectPath || typeof projectPath !== "string") {
      return NextResponse.json(
        { error: "Le champ 'path' est requis" },
        { status: 400 }
      );
    }

    // Analyse statique toujours disponible
    const result = await analyzeProject(projectPath, {
      agentic: false, // On fait l'agentique séparément
    });

    // Analyse agentique optionnelle
    let semantic = null;
    if (agentic) {
      try {
        const rows = await db.setting.findMany({
          where: { key: { in: ["api_key", "base_url", "model"] } },
        });
        const map: Record<string, string> = {};
        for (const r of rows) map[r.key] = r.value;

        const apiKey = map.api_key ?? process.env.LLM_API_KEY ?? process.env.AIONLABS_API_KEY ?? "";
        const baseUrl = map.base_url ?? process.env.LLM_BASE_URL ?? process.env.AIONLABS_BASE_URL ?? "https://api.openai.com/v1";
        const model = map.model ?? process.env.LLM_MODEL ?? process.env.AIONLABS_MODEL ?? "gpt-4o-mini";

        if (apiKey) {
          const agentic = await analyzeProject(projectPath, {
            agentic: true,
            apiKey,
            baseUrl,
            model,
          });
          semantic = agentic.semantic ?? null;
        }
      } catch (err) {
        console.error("Agentic analysis failed:", err);
        // Graceful degradation
      }
    }

    return NextResponse.json({
      ...result,
      semantic,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur d'analyse: ${msg}` },
      { status: 500 }
    );
  }
}

// GET /api/analyze?path=... — quick static analysis (GET for simplicity)
export async function GET(req: NextRequest) {
  try {
    const projectPath = req.nextUrl.searchParams.get("path");
    if (!projectPath) {
      return NextResponse.json(
        { error: "Paramètre 'path' requis" },
        { status: 400 }
      );
    }

    const result = await analyzeProject(projectPath, { agentic: false });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur d'analyse: ${msg}` },
      { status: 500 }
    );
  }
}