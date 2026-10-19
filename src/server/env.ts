import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/si_cehat?schema=public"),
  AUTH_SECRET: z
    .string()
    .min(1)
    .default("si-cehat-dev-secret-key-please-change-in-production"),
  AI_BASE_URL: z.string().optional().default("https://api.openai.com/v1"),
  AI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().optional().default("gpt-4o-mini"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn("[env] Invalid server environment configuration, falling back to safe defaults.");
    cachedEnv = serverEnvSchema.parse({});
    return cachedEnv;
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
