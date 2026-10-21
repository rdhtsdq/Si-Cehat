export type FoodCategory = "karbo" | "protein" | "sayur" | "buah" | "distractor";

export interface FoodItem {
  id: string;
  name: string;
  iconId: string;
  category: FoodCategory;
  isHealthy: boolean;
  color: string;
  tip: string;
}

export interface RoundDefinition {
  roundNumber: number;
  title: string;
  prompt: string;
  targetSlots: ("karbo" | "protein" | "sayur" | "buah")[];
  availableFoodIds: string[];
}

export interface KnowledgeQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
}

export interface GameContentVersion {
  version: string;
  rulesVersion: string;
  gameSlug: string;
  title: string;
  description: string;
  competency: string;
  foods: FoodItem[];
  rounds: RoundDefinition[];
  knowledgeAssessment: {
    instrumentVersion: string;
    questions: KnowledgeQuestion[];
  };
}
