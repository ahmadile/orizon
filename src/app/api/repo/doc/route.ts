import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/repo/doc?name=react&ecosystem=npm
// Fetches the documentation of a dependency and converts it to Markdown.
// Uses Firecrawl if a key is configured, falls back to a direct fetch +
// simple HTML-to-text conversion otherwise.
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const ecosystem = req.nextUrl.searchParams.get("ecosystem") ?? "npm";

  if (!name) {
    return NextResponse.json(
      { error: "name parameter is required" },
      { status: 400 }
    );
  }

  // Determine the doc URL based on the ecosystem
  let docUrl: string;
  switch (ecosystem) {
    case "npm":
      docUrl = `https://www.npmjs.com/package/${name}`;
      break;
    case "pypi":
      docUrl = `https://pypi.org/project/${name}/`;
      break;
    case "cargo":
      docUrl = `https://crates.io/crates/${name}`;
      break;
    case "go":
      docUrl = `https://pkg.go.dev/${name}`;
      break;
    default:
      docUrl = `https://www.npmjs.com/package/${name}`;
  }

  // Check if a Firecrawl key is configured
  const settings = await db.setting.findMany({
    where: { key: { in: ["firecrawl_key"] } },
  });
  const firecrawlKey = settings.find((s) => s.key === "firecrawl_key")?.value;

  if (firecrawlKey) {
    // Use Firecrawl API for clean Markdown
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: docUrl,
          formats: ["markdown"],
          onlyMainContent: true,
          maxTokens: 2000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const markdown = data?.data?.markdown;
        if (markdown) {
          return NextResponse.json({
            name,
            ecosystem,
            url: docUrl,
            markdown: markdown.slice(0, 4000),
            source: "firecrawl",
          });
        }
      }
    } catch {
      // fall through to direct fetch
    }
  }

  // Fallback: direct fetch + simple HTML-to-text
  try {
    const res = await fetch(docUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Orizon/1.0; +https://github.com/orizon)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch ${docUrl} (status ${res.status})` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Crude HTML → text conversion (strip tags, keep paragraphs)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    return NextResponse.json({
      name,
      ecosystem,
      url: docUrl,
      markdown: text || `Documentation de ${name} indisponible via fetch direct. Configurez Firecrawl dans les paramètres pour un rendu Markdown propre.`,
      source: "direct-fetch",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Doc fetch failed",
        hint: "Configurez une clé Firecrawl dans Paramètres → Provider IA pour une meilleure qualité.",
      },
      { status: 502 }
    );
  }
}
