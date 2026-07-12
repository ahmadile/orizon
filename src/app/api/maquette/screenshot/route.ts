import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================================
// Maquette screenshot endpoint.
// Takes raw HTML content and returns a screenshot URL via a rendering
// service. In a full deployment, this would use Browser Use (Python) or
// Playwright to render the HTML in a headless browser and capture it.
//
// For now, we use a data-URL approach: we encode the HTML and let the
// client render it in an iframe, then use the browser's native screenshot
// capability via the canvas API (client-side).
//
// This endpoint returns a signed data URL that the client can use directly.
// =========================================================================

interface RequestBody {
  html: string;
  variantId: string;
  variantLabel: string;
}

export async function POST(req: NextRequest) {
  try {
    const { html, variantId, variantLabel } = (await req.json()) as RequestBody;

    if (!html) {
      return NextResponse.json(
        { error: "html content is required" },
        { status: 400 }
      );
    }

    // Encode the HTML as a data URL the client can open in an iframe
    const base64Html = Buffer.from(html, "utf-8").toString("base64");
    const dataUrl = `data:text/html;base64,${base64Html}`;

    return NextResponse.json({
      variantId,
      variantLabel,
      dataUrl,
      // In a real deployment with Browser Use, this would be a PNG screenshot URL.
      // For now, the client renders the data URL in an iframe and can capture
      // it client-side via the canvas API if needed.
      note: "Rendu via iframe. Pour un screenshot PNG, branchez Browser Use (Python) ou Playwright.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Screenshot error" },
      { status: 500 }
    );
  }
}
