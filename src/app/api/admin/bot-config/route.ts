import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getResolvedBotConfig, maskApiKey } from "@/lib/bot-config";

async function checkIsAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await db.guardian.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

const updateBotConfigSchema = z.object({
  provider: z.string().trim().min(1).default("openai"),
  model: z.string().trim().min(1).default("gpt-4o-mini"),
  baseUrl: z.string().trim().optional(),
  apiKey: z.string().trim().optional(),
  systemPrompt: z.string().trim().min(10),
  temperature: z.number().min(0).max(2).default(0.5),
  maxTokens: z.number().int().min(50).max(4000).default(300),
});

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json(
      { error: { message: "Akses ditolak. Endpoint ini khusus untuk Administrator." } },
      { status: 403 }
    );
  }

  try {
    const config = await getResolvedBotConfig();
    return NextResponse.json({
      config: {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        maskedApiKey: maskApiKey(config.apiKey),
        isApiKeySet: config.isApiKeySet,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        isDbOverride: config.isDbOverride,
      },
    });
  } catch (error) {
    console.error("Fetch bot config error:", error);
    return NextResponse.json({ error: { message: "Gagal mengambil konfigurasi bot." } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json(
      { error: { message: "Akses ditolak. Endpoint ini khusus untuk Administrator." } },
      { status: 403 }
    );
  }

  try {
    const json = await request.json().catch(() => null);
    const parsed = updateBotConfigSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Data konfigurasi tidak valid: " + (parsed.error.issues[0]?.message || "") } },
        { status: 400 }
      );
    }

    const { provider, model, baseUrl, apiKey, systemPrompt, temperature, maxTokens } = parsed.data;

    const existing = await db.botConfig.findUnique({
      where: { id: "default" },
    });

    // If apiKey is omitted or sent as masked stars, retain existing key if present
    let finalApiKey: string | undefined = undefined;
    if (apiKey && !apiKey.includes("••••") && apiKey.trim().length > 0) {
      finalApiKey = apiKey.trim();
    } else if (existing?.apiKey) {
      finalApiKey = existing.apiKey;
    }

    const updated = await db.botConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        provider,
        model,
        baseUrl: baseUrl || null,
        apiKey: finalApiKey || null,
        systemPrompt,
        temperature,
        maxTokens,
      },
      update: {
        provider,
        model,
        baseUrl: baseUrl || null,
        apiKey: finalApiKey || null,
        systemPrompt,
        temperature,
        maxTokens,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        provider: updated.provider,
        model: updated.model,
        baseUrl: updated.baseUrl || "",
        maskedApiKey: maskApiKey(updated.apiKey),
        isApiKeySet: Boolean(updated.apiKey && updated.apiKey.length > 0),
        systemPrompt: updated.systemPrompt,
        temperature: updated.temperature,
        maxTokens: updated.maxTokens,
        isDbOverride: true,
      },
    });
  } catch (error) {
    console.error("Save bot config error:", error);
    return NextResponse.json({ error: { message: "Gagal menyimpan konfigurasi bot." } }, { status: 500 });
  }
}
