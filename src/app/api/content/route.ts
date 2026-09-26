import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todayChallenge as defaultChallenge, dailyQuiz as defaultQuiz, recommendedMenus as defaultMenus } from "@/lib/progress";

export async function GET() {
  try {
    const [challenge, quiz, menus] = await Promise.all([
      db.challenge.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      db.quiz.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      db.recommendedMenu.findMany({
        orderBy: { orderIndex: "asc" },
      }),
    ]);

    const resolvedChallenge = challenge
      ? {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          xp: challenge.xp,
        }
      : defaultChallenge;

    let resolvedQuiz = defaultQuiz;
    if (quiz) {
      try {
        const parsedOptions = JSON.parse(quiz.options);
        resolvedQuiz = {
          question: quiz.question,
          options: Array.isArray(parsedOptions) ? parsedOptions : defaultQuiz.options,
          answer: quiz.answer,
          xp: quiz.xp,
        };
      } catch {
        resolvedQuiz = defaultQuiz;
      }
    }

    const resolvedMenus = menus && menus.length > 0
      ? menus.map((m) => ({ title: m.title, note: m.note }))
      : defaultMenus;

    return NextResponse.json({
      challenge: resolvedChallenge,
      quiz: resolvedQuiz,
      recommendedMenus: resolvedMenus,
    });
  } catch (error) {
    console.error("Error fetching dynamic content:", error);
    return NextResponse.json({
      challenge: defaultChallenge,
      quiz: defaultQuiz,
      recommendedMenus: defaultMenus,
    });
  }
}
