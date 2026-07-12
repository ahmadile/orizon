import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================================
// Context compression endpoint — inspired by Headroom (headroomlabs-ai).
// Compresses tool outputs, file contents, and conversation history before
// they reach the LLM, reducing token usage on large repos.
// =========================================================================

interface RequestBody {
  files: { path: string; content: string }[];
  maxTokens?: number;
}

interface CompressedFile {
  path: string;
  originalLength: number;
  compressedLength: number;
  compressed: string;
  strategy: "full" | "sampled" | "signatures-only";
}

function compressContent(content: string, targetChars: number): { compressed: string; strategy: CompressedFile["strategy"] } {
  const noBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const noLineComments = noBlockComments.replace(/\/\/[^\n]*/g, "");
  const collapsed = noLineComments
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (collapsed.length <= targetChars) {
    return { compressed: collapsed, strategy: "full" };
  }

  const lines = collapsed.split("\n");
  const significantLines = lines.filter((line) =>
    /^(import|export|function|class|const|let|var|def |async|public|private|interface|type)\b/.test(
      line.trim()
    )
  );

  if (significantLines.join("\n").length <= targetChars) {
    return {
      compressed: significantLines.join("\n"),
      strategy: "signatures-only",
    };
  }

  const headCount = Math.floor(targetChars / 80 / 2);
  const head = lines.slice(0, headCount);
  const tail = lines.slice(-headCount);
  return {
    compressed: [...head, "// ... (compressé) ...", ...tail].join("\n"),
    strategy: "sampled",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { files, maxTokens } = (await req.json()) as RequestBody;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "files array is required" },
        { status: 400 }
      );
    }

    const targetChars = maxTokens ? maxTokens * 4 : 500;

    const compressed: CompressedFile[] = files.map((f) => {
      const result = compressContent(f.content, targetChars);
      return {
        path: f.path,
        originalLength: f.content.length,
        compressedLength: result.compressed.length,
        compressed: result.compressed,
        strategy: result.strategy,
      };
    });

    const totalOriginal = compressed.reduce((s, f) => s + f.originalLength, 0);
    const totalCompressed = compressed.reduce((s, f) => s + f.compressedLength, 0);
    const ratio = totalOriginal > 0 ? (totalCompressed / totalOriginal) * 100 : 0;

    return NextResponse.json({
      compressed,
      stats: {
        fileCount: compressed.length,
        totalOriginalChars: totalOriginal,
        totalCompressedChars: totalCompressed,
        compressionRatio: Math.round(ratio * 10) / 10,
        savedChars: totalOriginal - totalCompressed,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Compression error" },
      { status: 500 }
    );
  }
}
