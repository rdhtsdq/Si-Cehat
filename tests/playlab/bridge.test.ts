import { describe, expect, it } from "bun:test";
import { GameToAppMessage } from "../../src/client/playlab/bridge/types";

describe("PlayLabBridge Protocol Messages", () => {
  it("formats GAME_READY message correctly", () => {
    const msg: GameToAppMessage = {
      type: "GAME_READY",
      protocolVersion: 1,
    };
    const json = JSON.stringify(msg);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("GAME_READY");
    expect(parsed.protocolVersion).toBe(1);
  });

  it("formats GAME_COMPLETED message with decoupled scores", () => {
    const msg: GameToAppMessage = {
      type: "GAME_COMPLETED",
      sessionId: "test-session-uuid",
      scores: {
        gameplayScore: 100,
        knowledgeScore: 80,
        totalScore: 90,
        starsEarned: 3,
        xpAwarded: 75,
      },
    };
    const json = JSON.stringify(msg);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("GAME_COMPLETED");
    expect(parsed.sessionId).toBe("test-session-uuid");
    expect(parsed.scores.gameplayScore).toBe(100);
    expect(parsed.scores.knowledgeScore).toBe(80);
    expect(parsed.scores.xpAwarded).toBe(75);
  });

  it("formats EXIT_GAME message correctly with scores", () => {
    const msg: GameToAppMessage = {
      type: "EXIT_GAME",
      sessionId: "session-123",
      scores: {
        gameplayScore: 100,
        knowledgeScore: 100,
        totalScore: 100,
        starsEarned: 3,
        xpAwarded: 75,
      },
      totalScore: 100,
    };
    const json = JSON.stringify(msg);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("EXIT_GAME");
    expect(parsed.scores.totalScore).toBe(100);
    expect(parsed.totalScore).toBe(100);
  });
});
