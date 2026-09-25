import { systemPrompt as defaultSystemPrompt, type ChatMessage } from "@/lib/chat";
import { db } from "@/lib/db";
import { getResolvedBotConfig } from "@/lib/bot-config";

export interface AICompletionOptions {
  messages: ChatMessage[];
  childId?: string;
  sessionId?: string;
}

export interface AICompletionResult {
  reply: string;
  sessionId?: string;
  provider: "openai" | "gemini" | "mock";
}

// Red-flag triggers that require immediate child-safe redirection
const EMERGENCY_OR_MED_KEYWORDS = [
  "obat", "dosis", "resep", "paracetamol", "antibiotik", "insulin",
  "sakit parah", "darah tinggi", "kanker", "mati", "bunuh diri",
  "pingsan", "kejang", "luka bakar", "patah tulang"
];

function checkSafetyGuardrails(text: string): string | null {
  const lower = text.toLowerCase();
  
  // Self-harm / Emergency check
  if (lower.includes("bunuh") || lower.includes("mati")) {
    return "Jika kamu atau temanmu merasa sedih sekali atau butuh bantuan, segera peluk dan cerita ke orang tua, guru, atau orang dewasa terpercaya ya.";
  }

  // Medication or diagnostic inquiry
  const hasMedKeyword = EMERGENCY_OR_MED_KEYWORDS.some(kw => lower.includes(kw));
  if (hasMedKeyword) {
    return "Si Cehat bukan dokter, jadi Si Cehat tidak boleh memberi saran obat atau diagnosis. Kalau tubuhmu terasa sakit, yuk segera beritahu Ayah, Ibu, atau dokter!";
  }

  return null;
}

export async function orchestrateAIChat(options: AICompletionOptions): Promise<AICompletionResult> {
  const { messages, childId, sessionId } = options;
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";

  // 1. Pre-Execution Safety Guardrail Check
  const guardrailReply = checkSafetyGuardrails(lastUserMessage);
  if (guardrailReply) {
    await persistChat(childId, sessionId, lastUserMessage, guardrailReply);
    return {
      reply: guardrailReply,
      sessionId,
      provider: "mock",
    };
  }

  // 2. Resolve Dynamic Provider & Config (Database Override or Environment Fallback)
  const botConfig = await getResolvedBotConfig();
  const baseUrl = botConfig.baseUrl;
  const apiKey = botConfig.apiKey;
  const model = botConfig.model;
  const activeSystemPrompt = botConfig.systemPrompt || defaultSystemPrompt;

  let generatedReply = "";
  let providerUsed: "openai" | "gemini" | "mock" = "openai";

  const isMockKey = !apiKey || apiKey.includes("mock") || apiKey === "";

  if (isMockKey) {
    // Graceful offline mock response for local testing without spending tokens or failing
    providerUsed = "mock";
    generatedReply = getMockResponse(lastUserMessage);
  } else {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: botConfig.temperature ?? 0.5,
          max_tokens: botConfig.maxTokens ?? 300,
          messages: [{ role: "system", content: activeSystemPrompt }, ...messages],
        }),
      });

      if (!response.ok) {
        console.warn(`Upstream AI error (${response.status}), falling back to safe local responder.`);
        generatedReply = getMockResponse(lastUserMessage);
        providerUsed = "mock";
      } else {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content?.trim();
        if (content) {
          generatedReply = content;
        } else {
          generatedReply = getMockResponse(lastUserMessage);
          providerUsed = "mock";
        }
      }
    } catch (err) {
      console.warn("AI upstream request failed:", err);
      generatedReply = getMockResponse(lastUserMessage);
      providerUsed = "mock";
    }
  }

  // 3. Post-execution Safety Guardrail Check
  const postCheck = checkSafetyGuardrails(generatedReply);
  if (postCheck) {
    generatedReply = postCheck;
  }

  // 4. Persistence to DB (if childId or sessionId provided)
  const savedSessionId = await persistChat(childId, sessionId, lastUserMessage, generatedReply);

  return {
    reply: generatedReply,
    sessionId: savedSessionId || sessionId,
    provider: providerUsed,
  };
}

async function persistChat(
  childId?: string,
  sessionId?: string,
  userMessage?: string,
  assistantReply?: string
): Promise<string | undefined> {
  if (!childId && !sessionId) return undefined;

  try {
    let targetSessionId = sessionId;

    if (!targetSessionId && childId) {
      const newSession = await db.chatSession.create({
        data: { childId },
      });
      targetSessionId = newSession.id;
    }

    if (targetSessionId && userMessage && assistantReply) {
      await db.chatMessage.createMany({
        data: [
          { sessionId: targetSessionId, role: "user", content: userMessage },
          { sessionId: targetSessionId, role: "assistant", content: assistantReply },
        ],
      });
    }

    return targetSessionId;
  } catch (error) {
    console.error("Failed to persist chat session:", error);
    return sessionId;
  }
}

function getMockResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("sayur") || q.includes("brokoli") || q.includes("wortel")) {
    return "Sayur punya banyak vitamin dan serat yang bikin tubuhmu kuat dan pencernaan lancar! Wortel bikin matamu sehat, brokoli bantu daya tahan tubuh.";
  }
  if (q.includes("air") || q.includes("minum") || q.includes("haus")) {
    return "Air putih adalah minuman terbaik setiap hari! Minum 6 sampai 8 gelas bikin tubuhmu segar, fokus belajar, dan tidak gampang lelah.";
  }
  if (q.includes("manis") || q.includes("gula") || q.includes("soda") || q.includes("boba")) {
    return "Minuman manis boleh dinikmati sesekali saja, tapi jangan setiap hari ya. Terlalu banyak gula bisa bikin gigi berlubang dan badan cepat lemas.";
  }
  if (q.includes("gerak") || q.includes("olahraga") || q.includes("lari") || q.includes("main")) {
    return "Bergerak aktif 60 menit sehari bikin jantung kuat, otot terlatih, dan suasana hatimu jadi senang sekali!";
  }
  if (q.includes("buah") || q.includes("apel") || q.includes("pisang")) {
    return "Buah-buahan rasanya manis alami dan kaya vitamin. Makan apel atau pisang sebagai camilan itu pilihan yang super keren!";
  }
  return "Kunci tubuh sehat adalah makan makanan bergizi seimbang, cukup minum air putih, dan rajin bergerak setiap hari. Ada lagi yang mau kamu tanyakan ke Si Cehat?";
}
