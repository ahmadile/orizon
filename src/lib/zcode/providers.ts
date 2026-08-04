// =========================================================================
// Orizon — LLM provider configuration
//
// Support multi-provider : cloud (OpenAI, Aion Labs, etc.), local (Ollama),
// et providers personnalisés (tout endpoint compatible OpenAI).
//
// Pour ajouter un provider : suffit d'ajouter une entrée dans PROVIDERS.
// =========================================================================

export type ProviderId = "aionlabs" | "openai" | "ollama" | "anthropic" | "openrouter" | "custom";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: string[];
  /** clé API requise ? (Ollama = false) */
  apiKeyRequired: boolean;
  /** provider local (pas de clé, tourne sur la machine) */
  local: boolean;
  icon: string; // nom d'icône lucide
  docsUrl: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "GPT-4o, GPT-4o-mini, o1, o3. Le standard de référence.",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo", "o1", "o3-mini"],
    apiKeyRequired: true,
    local: false,
    icon: "Sparkles",
    docsUrl: "https://platform.openai.com/docs/api-reference",
  },
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
    id: "anthropic",
    label: "Anthropic",
    description: "Claude Sonnet, Haiku. Excellent pour le code et le raisonnement.",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      "claude-sonnet-4-20250514",
      "claude-haiku-3-5-20250101",
      "claude-opus-4-20250514",
    ],
    apiKeyRequired: true,
    local: false,
    icon: "Brain",
    docsUrl: "https://docs.anthropic.com/en/docs",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    description: "Modèles locaux via Ollama. Aucune clé requise, tout tourne sur votre machine.",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    models: ["llama3.2", "llama3.1", "qwen2.5", "deepseek-r1", "mistral", "codellama"],
    apiKeyRequired: false,
    local: true,
    icon: "HardDrive",
    docsUrl: "https://ollama.com",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Accès à 200+ modèles (GPT, Claude, Gemini, Llama, Mistral, DeepSeek...) via une seule API. Paiement à l'usage.",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/o3-mini",
      "anthropic/claude-sonnet-4-20250514",
      "anthropic/claude-3.5-haiku",
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
      "mistralai/mistral-7b-instruct",
      "deepseek/deepseek-r1",
      "qwen/qwen2.5-72b-instruct",
    ],
    apiKeyRequired: true,
    local: false,
    icon: "Network",
    docsUrl: "https://openrouter.ai/docs",
  },
  {
    id: "custom",
    label: "Personnalisé",
    description: "Tout endpoint compatible OpenAI : Together, Groq, DeepSeek, vLLM, etc.",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: [],
    apiKeyRequired: true,
    local: false,
    icon: "Plug",
    docsUrl: "",
  },
];

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

/**
 * Retourne la liste des providers avec leurs modèles.
 * Utile pour l'interface de configuration.
 */
export function getProviderModels(id: ProviderId): string[] {
  const provider = getProvider(id);
  return provider.models;
}