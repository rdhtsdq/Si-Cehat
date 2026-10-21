# Integration Contract Specification — Si-Cehat PlayLab

This document defines the formal integration contract between the **Flutter Mobile Host**, the **Standalone Web Game (`si-cehat-game-web`)**, and the **Si-Cehat Backend API**.

---

## 1. JavaScript Bridge Contract

Communication from the Web Game to the Flutter host runs through a named JavaScript channel: `PlayLabBridge`.

### 1.1 Bridge Message Types (`GameToAppMessage`)

```typescript
export type GameToAppMessage =
  | {
      type: "GAME_READY";
      protocolVersion: 1;
    }
  | {
      type: "GAME_COMPLETED";
      sessionId: string;
      scores: {
        gameplayScore: number;
        knowledgeScore: number;
        totalScore: number;
        starsEarned: number;
        xpAwarded: number;
      };
    }
  | {
      type: "EXIT_GAME";
    };
```

---

## 2. Session Bootstrap & Authorization Handshake

1. **Flutter** requests a session via authenticated `POST /api/game-sessions`, receiving a short-lived, single-use `bootstrapToken` (TTL 60s).
2. **Flutter** launches the WebView with `?bootstrap=TOKEN`.
3. **Web Game** exchanges the bootstrap token via `POST /api/game-sessions/bootstrap/exchange` for session authorization. No long-lived JWTs enter URLs or browser history.
4. **Result Validation:** On completion, the web client sends placed items and answers to `POST /api/game-sessions/:id/complete`. The backend recomputes the canonical score from server rules and awards XP.
5. The web client notifies Flutter via bridge (`GAME_COMPLETED`), and Flutter fetches the authoritative result directly from the backend.
