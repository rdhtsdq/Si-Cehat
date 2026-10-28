import { eq, inArray } from "drizzle-orm";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { drizzleDb } from "../db";
import { deviceTokens } from "../db/schema";

let pushInitialized = false;
let pushReady = false;

/** Masks a device token for logs (never log the whole token). */
export function maskToken(token: string): string {
  if (token.length <= 4) return "****";
  return `****${token.slice(-4)}`;
}

/**
 * Initializes Firebase Admin lazily. Returns false when no credentials are
 * configured so local development and CI keep working without Firebase.
 */
export function initPush(): boolean {
  if (pushInitialized) return pushReady;
  pushInitialized = true;

  try {
    if (getApps().length > 0) {
      pushReady = true;
      return true;
    }

    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (rawServiceAccount && rawServiceAccount.trim().length > 0) {
      const serviceAccount = JSON.parse(rawServiceAccount);
      initializeApp({ credential: cert(serviceAccount) });
      pushReady = true;
      return true;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({ credential: applicationDefault() });
      pushReady = true;
      return true;
    }
  } catch (error) {
    console.error("[Push] Failed to initialize Firebase Admin:", error);
    pushReady = false;
  }

  return pushReady;
}

export async function sendPushToGuardian(
  guardianId: string,
  input: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<void> {
  if (!initPush()) return;

  try {
    const tokens = await drizzleDb
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .where(eq(deviceTokens.guardianId, guardianId));

    if (tokens.length === 0) return;

    // FCM 17 uses Firebase Installation IDs (FIDs); the Admin SDK accepts
    // them through the FidMulticastMessage overload. The value stored in the
    // `token` column is the FID sent by the mobile client.
    const response = await getMessaging().sendEachForMulticast({
      fids: tokens.map((item) => item.token),
      notification: { title: input.title, body: input.body },
      data: input.data ?? {},
      android: {
        priority: "high",
        notification: { channelId: "general" },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = result.error?.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/installation-id-not-registered"
      ) {
        invalidTokens.push(tokens[index].token);
      }
    });

    if (invalidTokens.length > 0) {
      await drizzleDb
        .delete(deviceTokens)
        .where(inArray(deviceTokens.token, invalidTokens));
    }
  } catch (error) {
    // Push is best-effort: the notification row is already stored.
    console.error("[Push] Failed to send push notification:", error);
  }
}
