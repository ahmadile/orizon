import { NextRequest, NextResponse } from "next/server";
import { analyzeProject } from "@/lib/orizon/analyzer";
import { generateContextFiles } from "@/lib/orizon/context";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/context/download — télécharge les fichiers de contexte en zip
export async function POST(req: NextRequest) {
  try {
    const { path: projectPath, task, targets } = await req.json() as {
      path: string;
      task?: string;
      targets?: string[];
    };

    if (!projectPath) {
      return NextResponse.json(
        { error: "Le champ 'path' est requis" },
        { status: 400 }
      );
    }

    // Analyser le projet
    const analysis = await analyzeProject(projectPath, { agentic: false });

    // Générer les fichiers de contexte
    const allFiles = generateContextFiles(analysis, task);
    const files = targets?.length
      ? allFiles.filter((f) => targets.includes(f.target))
      : allFiles;

    // Créer un dossier temporaire avec les fichiers
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "orizon-context-"));
    const zipPath = path.join(os.tmpdir(), `orizon-contexte-${analysis.name}.zip`);

    try {
      // Écrire chaque fichier dans le dossier temporaire
      for (const file of files) {
        await fs.writeFile(path.join(tmpDir, file.filename), file.content, "utf-8");
      }

      // README
      await fs.writeFile(
        path.join(tmpDir, "README.txt"),
        `# Contexte Orizon — ${analysis.name}\n` +
        `Généré le ${new Date().toISOString().slice(0, 10)}\n` +
        `Projet: ${analysis.path}\n\n` +
        `Contient ${files.length} fichiers de contexte pour agents de codage.\n`
      );

      // Créer le zip via PowerShell (disponible sur Windows)
      const cmd = `powershell.exe -NoProfile -NonInteractive -Command "Compress-Archive -Path '${tmpDir}\\*' -DestinationPath '${zipPath}' -Force"`;
      await execAsync(cmd, { timeout: 30_000 });

      // Lire le zip
      const zipBuffer = await fs.readFile(zipPath);

      return new Response(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="orizon-contexte-${analysis.name}.zip"`,
          "Content-Length": zipBuffer.length.toString(),
        },
      });
    } finally {
      // Nettoyer
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      await fs.rm(zipPath, { recursive: true, force: true }).catch(() => {});
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur: ${msg}` },
      { status: 500 }
    );
  }
}