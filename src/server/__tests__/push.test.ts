import { describe, expect, it } from "bun:test";
import { initPush, maskToken } from "../services/push";

describe("Push service", () => {
  it("masks device tokens for logs", () => {
    expect(maskToken("abcdefgh1234")).toBe("****1234");
    expect(maskToken("abc")).toBe("****");
  });

  it("stays disabled when Firebase credentials are absent", () => {
    const previousJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const previousPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

    expect(initPush()).toBe(false);

    if (previousJson !== undefined) {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = previousJson;
    }
    if (previousPath !== undefined) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = previousPath;
    }
  });
});
