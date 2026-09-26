import { db } from "@/lib/db";
import { systemPrompt as defaultSystemPrompt } from "@/lib/chat";

export interface ResolvedBotConfig {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isDbOverride: boolean;
  isApiKeySet: boolean;
}

export function maskApiKey(key: string | null | undefined): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  const start = trimmed.slice(0, 7);
  const end = trimmed.slice(-4);
  return `${start}••••••••${end}`;
}

export async function getResolvedBotConfig(): Promise<ResolvedBotConfig> {
  const envBaseUrl = process.env.AI_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1";
  const envApiKey = process.env.AI_API_KEY || "";
  const envModel = process.env.AI_MODEL || "gpt-4o-mini";

  try {
    const record = await db.botConfig.findUnique({
      where: { id: "default" },
    });

    if (record) {
      const activeApiKey = record.apiKey && record.apiKey.trim().length > 0 ? record.apiKey : envApiKey;
      const activeBaseUrl = record.baseUrl && record.baseUrl.trim().length > 0 ? record.baseUrl.replace(/\/$/, "") : envBaseUrl;
      const activeModel = record.model && record.model.trim().length > 0 ? record.model : envModel;
      const activeSystemPrompt = record.systemPrompt && record.systemPrompt.trim().length > 0 ? record.systemPrompt : defaultSystemPrompt;

      return {
        provider: record.provider || "openai",
        model: activeModel,
        baseUrl: activeBaseUrl,
        apiKey: activeApiKey,
        systemPrompt: activeSystemPrompt,
        temperature: record.temperature ?? 0.5,
        maxTokens: record.maxTokens ?? 300,
        isDbOverride: true,
        isApiKeySet: Boolean(activeApiKey && activeApiKey.length > 0),
      };
    }
  } catch (err) {
    console.error("Failed to read botConfig from database, using env fallback:", err);
  }

  return {
    provider: "openai",
    model: envModel,
    baseUrl: envBaseUrl,
    apiKey: envApiKey,
    systemPrompt: defaultSystemPrompt,
    temperature: 0.5,
    maxTokens: 300,
    isDbOverride: false,
    isApiKeySet: Boolean(envApiKey && envApiKey.length > 0),
  };
}
