/**
 * Security utilities - Rate limiting, encryption, etc.
 */

// Simple in-memory rate limiting store (in production, use Redis)
// Key: "ip:endpoint" or "email:endpoint"
const RATE_LIMIT_STORE = new Map<
  string,
  { count: number; resetTime: number }
>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxAttempts: number = RATE_LIMIT_MAX_ATTEMPTS
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let record = RATE_LIMIT_STORE.get(key);

  // Reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  const allowed = record.count < maxAttempts;
  record.count++;

  RATE_LIMIT_STORE.set(key, record);

  return {
    allowed,
    remaining: Math.max(0, maxAttempts - record.count),
    resetTime: record.resetTime,
  };
}

// Cleanup old entries periodically
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of RATE_LIMIT_STORE.entries()) {
    if (now > record.resetTime + RATE_LIMIT_WINDOW) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
}

// Get client IP from request
export function getClientIP(
  headers: Headers | Record<string, string | undefined>
): string {
  const forwarded = headers instanceof Headers
    ? headers.get("x-forwarded-for")
    : headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const ip = headers instanceof Headers
    ? headers.get("x-real-ip")
    : headers["x-real-ip"];

  return ip || "unknown";
}

// CSRF token generation (basic)
import crypto from "crypto";

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyCSRFToken(token: string, stored: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(stored)
  );
}
