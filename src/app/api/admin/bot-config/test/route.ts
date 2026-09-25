import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getResolvedBotConfig } from "@/lib/bot-config";

async function checkIsAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await db.guardian.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

const testConfigSchema = z.object({
  model: z.string().trim().optional(),
  baseUrl: z.string().trim().optional(),
  apiKey: z.string().trim().optional(),
  systemPrompt: z.string().trim().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  testPrompt: z.string().trim().default("Halo Si Cehat! Kenapa kita harus makan sayur setiap hari?"),
});

export async function POST(request: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json(
      { error: { message: "Akses ditolak. Endpoint ini khusus untuk Administrator." } },
      { status: 403 }
    );
  }

  try {
    const json = await request.json().catch(() => ({}));
    const parsed = testConfigSchema.safeParse(json);
    const body = parsed.success ? parsed.data : { testPrompt: "Halo Si Cehat!" };

    const resolved = await getResolvedBotConfig();

    const model = body.model || resolved.model;
    const baseUrl = (body.baseUrl || resolved.baseUrl).replace(/\/$/, "");
    const apiKey = body.apiKey && !body.apiKey.includes("••••") ? body.apiKey : resolved.apiKey;
    const systemPrompt = body.systemPrompt || resolved.systemPrompt;
    const temperature = body.temperature ?? resolved.temperature;
    const maxTokens = body.maxTokens ?? 150;
    const testPrompt = body.testPrompt || "Halo Si Cehat! Kenapa kita harus makan sayur setiap hari?";

    if (!apiKey || apiKey.includes("mock") || apiKey === "") {
      return NextResponse.json({
        success: true,
        isMock: true,
        latencyMs: 12,
        model: `${model} (Simulasi Offline / Mock Key)`,
        reply: "Halo Petualang Cilik! Sayur itu kaya serat dan vitamin yang membuat tubuhmu kuat, lincah bergerak, dan tidak mudah lemas!",
      });
    }

    const startTime = performance.now();

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: testPrompt },
        ],
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        {
          error: {
            message: `Upstream error (${response.status}): ${errText.slice(0, 300)}`,
            status: response.status,
          },
        },
        { status: 502 }
      );
    }

    const resJson = await response.json();
    const reply = resJson.choices?.[0]?.message?.content?.trim() || "(Tidak ada balasan yang dihasilkan)";

    return NextResponse.json({
      success: true,
      isMock: false,
      latencyMs,
      model,
      reply,
    });
  } catch (error: unknown) {
    console.error("Test bot config error:", error);
    const msg = error instanceof Error ? error.message : "Gagal menghubungi endpoint model.";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
