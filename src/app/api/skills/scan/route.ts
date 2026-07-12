import { NextRequest, NextResponse } from "next/server";
import { ZCODE_SKILLS } from "@/lib/zcode/oss-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================================
// Skill security scanner — inspired by NVIDIA SkillSpector.
// Scans each skill's description for known malicious patterns:
//   - Prompt injection attempts
//   - Data exfiltration instructions
//   - Destructive commands
//   - Privilege escalation
//
// In production, this would call the real SkillSpector (Python) via a
// subprocess. For now, we implement a TypeScript-equivalent heuristic
// scanner that catches the most common attack vectors.
// =========================================================================

interface ScanResult {
  skillId: string;
  skillName: string;
  status: "safe" | "warning" | "blocked";
  findings: { type: string; detail: string; severity: "low" | "medium" | "high" }[];
}

// Known malicious patterns (simplified SkillSpector rules)
const MALICIOUS_PATTERNS: { pattern: RegExp; type: string; severity: "low" | "medium" | "high"; detail: string }[] = [
  {
    pattern: /ignore\s+(previous|all|the\s+above)\s+instructions/i,
    type: "prompt-injection",
    severity: "high",
    detail: "Tentative d'injection de prompt : instruction d'ignorer les consignes précédentes",
  },
  {
    pattern: /(send|post|exfiltrate|upload)\s+.*(api\s?key|token|secret|password|credential)/i,
    type: "exfiltration",
    severity: "high",
    detail: "Instruction potentielle d'exfiltration de secrets",
  },
  {
    pattern: /(rm\s+-rf|del\s+\/[sf]|format\s+[a-z]:|mkfs)/i,
    type: "destructive",
    severity: "high",
    detail: "Commande destructrice détectée",
  },
  {
    pattern: /(sudo|chmod\s+\+x|chown\s+root)/i,
    type: "privilege-escalation",
    severity: "medium",
    detail: "Escalade de privilèges potentielle",
  },
  {
    pattern: /(eval\s*\(|exec\s*\(|child_process|subprocess)/i,
    type: "code-execution",
    severity: "medium",
    detail: "Exécution de code dynamique potentielle",
  },
  {
    pattern: /(http|https):\/\/(?!github\.com|npmjs\.com|pypi\.org)/i,
    type: "external-call",
    severity: "low",
    detail: "Appel réseau vers un domaine non approuvé",
  },
];

function scanSkill(skill: { id: string; name: string; description: string }): ScanResult {
  const findings: ScanResult["findings"] = [];

  // Scan the description for malicious patterns
  for (const rule of MALICIOUS_PATTERNS) {
    if (rule.pattern.test(skill.description)) {
      findings.push({
        type: rule.type,
        detail: rule.detail,
        severity: rule.severity,
      });
    }
  }

  // Determine status
  let status: ScanResult["status"] = "safe";
  if (findings.some((f) => f.severity === "high")) {
    status = "blocked";
  } else if (findings.some((f) => f.severity === "medium")) {
    status = "warning";
  }

  return {
    skillId: skill.id,
    skillName: skill.name,
    status,
    findings,
  };
}

// GET /api/skills/scan — scan all skills
export async function GET() {
  const results: ScanResult[] = ZCODE_SKILLS.map((skill) =>
    scanSkill({
      id: skill.id,
      name: skill.name,
      description: skill.description,
    })
  );

  const summary = {
    total: results.length,
    safe: results.filter((r) => r.status === "safe").length,
    warning: results.filter((r) => r.status === "warning").length,
    blocked: results.filter((r) => r.status === "blocked").length,
  };

  return NextResponse.json({ results, summary });
}

// POST /api/skills/scan — scan a specific skill by id
export async function POST(req: NextRequest) {
  try {
    const { skillId } = await req.json();
    const skill = ZCODE_SKILLS.find((s) => s.id === skillId);

    if (!skill) {
      return NextResponse.json(
        { error: `Skill ${skillId} not found` },
        { status: 404 }
      );
    }

    const result = scanSkill({
      id: skill.id,
      name: skill.name,
      description: skill.description,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan error" },
      { status: 500 }
    );
  }
}
