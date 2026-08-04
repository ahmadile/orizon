import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  isValidEmail,
  validatePassword,
  isValidName,
  sanitizeInput,
  isSuspiciousInput,
} from "@/lib/auth/validation";
import { checkRateLimit, getClientIP } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  email: string;
  password: string;
  name?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(req.headers);
    const rateLimit = checkRateLimit(ip, "/api/auth/register", 3);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Trop de tentatives d'enregistrement. Réessayez plus tard.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429, headers: { "Retry-After": String(rateLimit.remaining) } }
      );
    }

    const { email, password, name } = (await req.json()) as RequestBody;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Check for suspicious input
    if (isSuspiciousInput(email) || isSuspiciousInput(password)) {
      return NextResponse.json(
        { error: "Entrée non valide" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format d'email non valide" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name && !isValidName(name)) {
      return NextResponse.json(
        { error: "Nom non valide" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedName = name ? sanitizeInput(name) : null;

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Hash the password with higher rounds for security
    const passwordHash = await bcrypt.hash(password, 14);

    // Create the user
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: sanitizedName,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(
      {
        ok: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Erreur d'enregistrement. Veuillez réessayer plus tard." },
      { status: 500 }
    );
  }
}
