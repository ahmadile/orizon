import { NextRequest, NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";
import { getClientIP, checkRateLimit } from "@/lib/security";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

/**
 * Security headers middleware
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

/**
 * Rate limiting middleware for APIs
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  maxAttempts: number = 30,
  windowMinutes: number = 15
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = getClientIP(req.headers);
    const endpoint = new URL(req.url).pathname;

    const rateLimit = checkRateLimit(ip, endpoint, maxAttempts);

    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.remaining),
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await handler(req);
    return withSecurityHeaders(response);
  };
}

/**
 * Authentication middleware
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ authenticated: boolean; session: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        authenticated: false,
        session: null,
        error: "Not authenticated",
      };
    }

    return {
      authenticated: true,
      session,
    };
  } catch (err) {
    return {
      authenticated: false,
      session: null,
      error: "Authentication check failed",
    };
  }
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  allowedOrigins: string[] = ["http://localhost:3000"]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":
            allowedOrigins.includes(req.headers.get("origin") || "")
              ? req.headers.get("origin")!
              : allowedOrigins[0],
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await handler(req);

    response.headers.set(
      "Access-Control-Allow-Origin",
      allowedOrigins.includes(req.headers.get("origin") || "")
        ? req.headers.get("origin")!
        : allowedOrigins[0]
    );

    return response;
  };
}
