/**
 * Validation utilities for security
 */

// Email validation (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// Password strength validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Le mot de passe doit faire au moins 8 caractères");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Username/Name validation
export function isValidName(name: string): boolean {
  return name.length > 0 && name.length <= 100 && !/[<>\"'&]/.test(name);
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 255);
}

// Check for SQL injection patterns (basic)
export function isSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /--/,
    /\/\*/,
    /xp_/i,
    /sp_/i,
    /;\s*DROP/i,
    /;\s*DELETE/i,
    /;\s*UPDATE/i,
    /UNION\s+SELECT/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}
