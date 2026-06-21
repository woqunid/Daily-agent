import type { AiProvider } from "@/lib/types";

export type AiConfig = Readonly<{
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}>;

const PROVIDERS = ["openai", "anthropic", "gemini"] as const;

export function readAiConfig(env: NodeJS.ProcessEnv): AiConfig {
  const provider = parseProvider(env.AI_PROVIDER);
  const apiKey = readRequiredEnv(env.AI_API_KEY, "AI_API_KEY");
  const model = readRequiredEnv(env.AI_MODEL, "AI_MODEL");
  const baseUrl = normalizeOptionalEnv(env.AI_BASE_URL);

  return { provider, apiKey, model, baseUrl };
}

function parseProvider(value: string | undefined): AiProvider {
  if (!value) {
    throw new Error("缺少环境变量 AI_PROVIDER");
  }

  if (PROVIDERS.includes(value as AiProvider)) {
    return value as AiProvider;
  }

  throw new Error("AI_PROVIDER 必须是 openai、anthropic 或 gemini");
}

function readRequiredEnv(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`缺少环境变量 ${name}`);
  }

  return value.trim();
}

function normalizeOptionalEnv(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return value.trim().replace(/\/$/, "");
}
