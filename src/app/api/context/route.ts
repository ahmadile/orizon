import { NextRequest, NextResponse } from "next/server";
import { analyzeProject } from "@/lib/orizon/analyzer";
import { generateContextFiles } from "@/lib/orizon/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/context — génère les fichiers de contexte pour un projet
export async function POST(req: NextRequest) {
  try {
    const { path, task, targets } = await req.json() as {
      path: string;
      task?: string;
      targets?: string[];
    };

    if (!path) {
      return NextResponse.json(
        { error: "Le champ 'path' est requis" },
        { status: 400 }
      );
    }

    // Analyser le projet
    const analysis = await analyzeProject(path, { agentic: false });

    // Générer les fichiers de contexte
    const allFiles = generateContextFiles(analysis, task);

    // Filtrer par cible si spécifié
    const files = targets?.length
      ? allFiles.filter((f) => targets.includes(f.target))
      : allFiles;

    return NextResponse.json({
      projectName: analysis.name,
      projectPath: analysis.path,
      files,
      count: files.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur: ${msg}` },
      { status: 500 }
    );
  }
}