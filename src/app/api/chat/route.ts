import { NextResponse } from "next/server";
import { z } from "zod";
import { chatMessageSchema } from "@/lib/chat";
import { orchestrateAIChat } from "@/lib/ai-orchestrator";

const chatRequestBodySchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
  childId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const body = chatRequestBodySchema.safeParse(raw);

    if (!body.success) {
      return NextResponse.json(
        { error: { message: "Pertanyaannya belum bisa dibaca. Coba tulis lebih singkat ya." } },
        { status: 400 }
      );
    }

    const { messages, childId, sessionId } = body.data;

    const result = await orchestrateAIChat({
      messages,
      childId,
      sessionId,
    });

    return NextResponse.json({
      message: result.reply,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: { message: "Si Cehat sedang istirahat sebentar. Coba tanya lagi ya!" } },
      { status: 500 }
    );
  }
}
