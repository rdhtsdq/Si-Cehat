import { hc } from "hono/client";
import type { AppType } from "@/server/app";

export const rpcClient = hc<AppType>("/");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const errMsg =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        (typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : (payload as { error?: { message?: string } }).error?.message)) ||
      `Permintaan gagal dengan status ${res.status}`;
    throw new ApiError(errMsg, res.status);
  }

  return payload as T;
}
