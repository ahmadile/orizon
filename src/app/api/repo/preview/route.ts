import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/repo/preview?url=https://example.com — screenshot via microlink.io (free, no key)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "url parameter is required" },
      { status: 400 }
    );
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "Only http/https URLs are allowed" },
        { status: 400 }
      );
    }

    // Use microlink.io free API for screenshots
    const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(
      url
    )}&screenshot=true&meta=false&embed=screenshot.url`;

    const res = await fetch(screenshotUrl, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Screenshot service error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.status !== "success" || !data.data?.screenshot?.url) {
      return NextResponse.json(
        { error: "Could not capture screenshot. The site may be down or blocking bots." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url,
      screenshot: data.data.screenshot.url,
      title: data.data?.title ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Preview error" },
      { status: 500 }
    );
  }
}
