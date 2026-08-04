import { NextRequest, NextResponse } from "next/server";
import { createFork } from "@/lib/orizon/fork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/fork — fork a project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourcePath, targetPath, projectName, modules, includeReusable, includeConfig, intention, initGit, initialCommit } = body;

    if (!sourcePath || !targetPath || !projectName) {
      return NextResponse.json(
        { error: "Champs requis : sourcePath, targetPath, projectName" },
        { status: 400 }
      );
    }

    const result = await createFork({
      sourcePath,
      targetPath,
      projectName,
      modules,
      includeReusable: includeReusable !== false,
      includeConfig: includeConfig !== false,
      intention,
      initGit: initGit !== false,
      initialCommit: initialCommit !== false,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur fork: ${msg}` },
      { status: 500 }
    );
  }
}