// =========================================================================
// ZCode — LLM provider configuration
// Supports multiple providers: Aion Labs (cloud), OpenAI-compatible (custom),
// and Ollama (local).
// =========================================================================

export type ProviderId = "aionlabs" | "openai-compatible" | "ollama";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: string[];
  /** whether the API key is required (Ollama = false) */
  apiKeyRequired: boolean;
  /** whether this provider is local (no key, runs on the user's machine) */
  local: boolean;
  icon: string; // lucide icon name
  docsUrl: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "aionlabs",
    label: "Aion Labs",
    description: "Modèles Aion-3.0, OpenAI-compatible. Rapide, raisonnement transparent.",
    defaultBaseUrl: "https://api.aionlabs.ai/v1",
    defaultModel: "aion-labs/aion-3.0",
    models: [
      "aion-labs/aion-3.0",
      "aion-labs/aion-3.0-mini",
    ],
    apiKeyRequired: true,
    local: false,
    icon: "Cloud",
    docsUrl: "https://www.aionlabs.ai/docs",
  },
  {
    id: "openai-compatible",
    label: "OpenAI-compatible",
    description: "Tout endpoint compatible OpenAI : OpenAI, Together, Groq, DeepSeek, vLLM, etc.",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    apiKeyRequired: true,
    local: false,
    icon: "Plug",
    docsUrl: "https://platform.openai.com/docs/api-reference",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    description: "Modèles locaux via Ollama. Aucune clé requise, tout tourne sur votre machine.",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    models: ["llama3.2", "llama3.1", "qwen2.5", "deepseek-r1", "mistral"],
    apiKeyRequired: false,
    local: true,
    icon: "HardDrive",
    docsUrl: "https://ollama.com",
  },
];

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}
