import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { withSecurityHeaders } from "@/lib/api-security";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/me
 * Returns the current user information
 * Protected: Requires authentication
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      const response = NextResponse.json(
        { user: null },
        { status: 200 }
      );
      return withSecurityHeaders(response);
    }

    const response = NextResponse.json({ user });
    return withSecurityHeaders(response);
  } catch (err) {
    console.error("Error fetching current user:", err);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withSecurityHeaders(response);
  }
}

/**
 * PUT /api/me
 * Update current user information
 * Protected: Requires authentication
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      return withSecurityHeaders(response);
    }

    const { name, image } = await req.json();

    // Validate input
    if (name !== undefined) {
      if (typeof name !== "string" || name.length === 0 || name.length > 100) {
        const response = NextResponse.json(
          { error: "Invalid name format" },
          { status: 400 }
        );
        return withSecurityHeaders(response);
      }
    }

    if (image !== undefined) {
      if (typeof image !== "string" || image.length === 0 || image.length > 500) {
        const response = NextResponse.json(
          { error: "Invalid image format" },
          { status: 400 }
        );
        return withSecurityHeaders(response);
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(image !== undefined && { image: image.trim() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({ user: updatedUser });
    return withSecurityHeaders(response);
  } catch (err) {
    console.error("Error updating user:", err);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withSecurityHeaders(response);
  }
}
