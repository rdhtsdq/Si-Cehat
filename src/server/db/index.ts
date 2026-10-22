import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getServerEnv } from "../env";

const env = getServerEnv();

/**
 * Strip Prisma-specific `?schema=...` query parameter from DATABASE_URL
 * because postgres.js forwards query params as PostgreSQL GUC startup parameters,
 * which causes `PostgresError: unrecognized configuration parameter "schema"`.
 */
export function normalizeDatabaseUrl(rawUrl: string): {
  cleanUrl: string;
  searchPath?: string;
} {
  try {
    const parsed = new URL(rawUrl);
    const schemaParam = parsed.searchParams.get("schema") || undefined;
    if (schemaParam) {
      parsed.searchParams.delete("schema");
    }
    return {
      cleanUrl: parsed.toString(),
      searchPath: schemaParam,
    };
  } catch {
    return { cleanUrl: rawUrl };
  }
}

const { cleanUrl, searchPath } = normalizeDatabaseUrl(env.DATABASE_URL);

const globalForDrizzle = globalThis as unknown as {
  pgSql?: ReturnType<typeof postgres>;
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
  currentDbUrl?: string;
};

if (globalForDrizzle.currentDbUrl && globalForDrizzle.currentDbUrl !== cleanUrl) {
  try {
    globalForDrizzle.pgSql?.end();
  } catch {}
  globalForDrizzle.pgSql = undefined;
  globalForDrizzle.drizzleDb = undefined;
}

export const pgSql =
  globalForDrizzle.pgSql ??
  postgres(cleanUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 5,
    connection: searchPath ? { search_path: searchPath } : undefined,
  });

export const drizzleDb =
  globalForDrizzle.drizzleDb ?? drizzle(pgSql, { schema });

if (env.NODE_ENV !== "production") {
  globalForDrizzle.pgSql = pgSql;
  globalForDrizzle.drizzleDb = drizzleDb;
  globalForDrizzle.currentDbUrl = cleanUrl;
}

export { schema };
