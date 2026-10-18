import { defineConfig } from "drizzle-kit";

function cleanPgUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.searchParams.delete("schema");
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanPgUrl(
      process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/si_cehat"
    ),
  },
});
