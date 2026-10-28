import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

function loadDotenvFiles(): void {
  const cwd = process.cwd();
  const envFiles = [".env", ".env.local"];
  for (const file of envFiles) {
    const fullPath = path.resolve(cwd, file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {}
    }
  }
}

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:password@localhost:5432/si_cehat?schema=public"),
  AUTH_SECRET: z
    .string()
    .min(1)
    .default("si-cehat-dev-secret-key-please-change-in-production"),
  AI_BASE_URL: z.string().optional().default("https://api.openai.com/v1"),
  AI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().optional().default("gpt-4o-mini"),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  loadDotenvFiles();
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn("[env] Invalid server environment configuration, falling back to safe defaults.");
    cachedEnv = serverEnvSchema.parse({});
    return cachedEnv;
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

