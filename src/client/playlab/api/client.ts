import { CompleteSessionPayload, GameEventPayload, GameResultDto, GameSessionDto } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export class GameApiClient {
  private baseUrl: string;
  private sessionToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl ? (baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl) : "";
  }

  setSessionToken(token: string | null): void {
    this.sessionToken = token;
  }

  /**
   * Exchange an ephemeral bootstrap token for session authorization and session ID
   */
  async exchangeBootstrapToken(bootstrapToken: string): Promise<{ session: GameSessionDto; sessionAuthToken: string }> {
    const res = await fetch(`${this.baseUrl}/api/game-sessions/bootstrap/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bootstrapToken }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Gagal menukar token sesi permainan.");
    }

    const data = await res.json();
    this.setSessionToken(data.sessionAuthToken || null);
    return data;
  }

  /**
   * Development fallback: Create session directly if no bootstrap token is provided
   */
  async createDirectSession(gameSlug: string = "piring-sehat-nimbo", childId?: string): Promise<{ session: GameSessionDto }> {
    const res = await fetch(`${this.baseUrl}/api/game-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlug, childId }),
    });

    if (!res.ok) {
      throw new Error("Gagal membuat sesi permainan.");
    }

    return await res.json();
  }

  /**
   * Submit telemetry events (bounded, minimal)
   */
  async sendEvent(sessionId: string, event: GameEventPayload): Promise<boolean> {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.sessionToken) {
        headers["Authorization"] = `Bearer ${this.sessionToken}`;
      }

      await fetch(`${this.baseUrl}/api/game-sessions/${sessionId}/events`, {
        method: "POST",
        headers,
        body: JSON.stringify(event),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Complete session and request server-side score calculation
   */
  async completeSession(sessionId: string, payload: CompleteSessionPayload): Promise<GameResultDto> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.sessionToken) {
      headers["Authorization"] = `Bearer ${this.sessionToken}`;
    }

    const res = await fetch(`${this.baseUrl}/api/game-sessions/${sessionId}/complete`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Gagal menyelesaikan sesi permainan di server.");
    }

    const data = await res.json();
    return data.result;
  }
}

export const gameApi = new GameApiClient();
