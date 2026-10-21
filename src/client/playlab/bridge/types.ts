export interface GameScores {
  gameplayScore: number;
  knowledgeScore: number;
  totalScore: number;
  starsEarned: number;
  xpAwarded: number;
}

export type GameToAppMessage =
  | {
      type: "GAME_READY";
      protocolVersion: number;
    }
  | {
      type: "GAME_COMPLETED";
      sessionId: string;
      scores: GameScores;
      totalScore?: number;
      gameplayScore?: number;
      knowledgeScore?: number;
      starsEarned?: number;
      xpAwarded?: number;
    }
  | {
      type: "EXIT_GAME";
      sessionId?: string;
      scores?: GameScores;
      totalScore?: number;
      gameplayScore?: number;
      knowledgeScore?: number;
      starsEarned?: number;
      xpAwarded?: number;
    };

export interface BridgeHandler {
  postMessage: (messageString: string) => void;
}
