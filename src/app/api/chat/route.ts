import { NextResponse } from "next/server";
import { z } from "zod";
import { chatRequestSchema, systemPrompt } from "@/lib/chat";

const envSchema = z.object({
  AI_BASE_URL: z.string().url(),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().min(1),
});

const providerResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().trim().min(1),
        }),
      }),
    )
    .min(1),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

export async function POST(request: Request) {
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    return jsonError("Si Cehat belum tersambung ke layanan AI.", 503);
  }

  const body = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError("Pertanyaannya belum bisa dibaca. Coba tulis lebih singkat ya.", 400);
  }

  try {
    const response = await fetch(`${env.data.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.data.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.data.AI_MODEL,
        temperature: 0.5,
        max_tokens: 300,
        messages: [{ role: "system", content: systemPrompt }, ...body.data.messages],
      }),
    });

    if (!response.ok) {
      return jsonError("Si Cehat sedang sulit menjawab. Coba lagi sebentar ya.", 502);
    }

    const parsed = providerResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return jsonError("Jawaban Si Cehat belum terbaca. Coba lagi ya.", 502);
    }

    return NextResponse.json({ message: parsed.data.choices[0].message.content });
  } catch {
    return jsonError("Si Cehat sedang tidak tersambung. Coba lagi sebentar ya.", 502);
  }
}
