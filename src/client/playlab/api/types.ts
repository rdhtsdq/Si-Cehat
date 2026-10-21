export interface GameSessionDto {
  id: string;
  gameSlug: string;
  gameVersion: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  startedAt: string;
}

export interface GameResultDto {
  sessionId: string;
  gameplayScore: number;
  knowledgeScore: number;
  totalScore: number;
  starsEarned: number;
  xpAwarded: number;
  feedbackSummary: string;
  rulesVersion: string;
}

export interface CompleteSessionPayload {
  plateItems: string[];
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}

export interface GameEventPayload {
  eventType: string;
  sequence: number;
  payload: Record<string, unknown>;
}
