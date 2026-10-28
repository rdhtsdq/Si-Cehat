import { drizzleDb } from "../db";
import { notifications } from "../db/schema";
import { sendPushToGuardian } from "./push";

export type NotificationType =
  | "SYSTEM"
  | "REMINDER"
  | "CONSULTATION"
  | "EDUCATION"
  | "GAME";

export async function createNotification(input: {
  guardianId: string;
  title: string;
  message: string;
  type?: NotificationType;
  referenceId?: string | null;
}) {
  try {
    const [created] = await drizzleDb
      .insert(notifications)
      .values({
        guardianId: input.guardianId,
        title: input.title,
        message: input.message,
        type: input.type ?? "SYSTEM",
        referenceId: input.referenceId ?? null,
      })
      .returning();

    if (created) {
      // Fire-and-forget so FCM latency does not slow down the API response.
      void sendPushToGuardian(input.guardianId, {
        title: input.title,
        body: input.message,
        data: {
          type: input.type ?? "SYSTEM",
          referenceId: input.referenceId ?? "",
        },
      });
    }

    return created;
  } catch (error) {
    // Notifications are a side effect: never fail the main operation because
    // the notification could not be stored.
    console.error("[Notification] Failed to create notification:", error);
    return null;
  }
}
