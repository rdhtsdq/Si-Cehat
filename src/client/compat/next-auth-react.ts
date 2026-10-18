export interface SignInOptions {
  redirect?: boolean;
  email?: string;
  password?: string;
  callbackUrl?: string;
  [key: string]: unknown;
}

export interface SignInResponse {
  error?: string | null;
  status: number;
  ok: boolean;
  url?: string | null;
}

export async function signIn(
  _provider?: string,
  options?: SignInOptions
): Promise<SignInResponse | undefined> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      email: options?.email ?? "",
      password: options?.password ?? "",
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg =
      data?.error?.message || data?.error || "Email atau kata sandi tidak cocok.";
    return {
      error: errorMsg,
      status: res.status,
      ok: false,
      url: null,
    };
  }

  window.dispatchEvent(new CustomEvent("si-cehat-auth-refresh"));

  if (options?.redirect !== false && options?.callbackUrl) {
    window.location.href = options.callbackUrl;
    return undefined;
  }

  return {
    error: null,
    status: 200,
    ok: true,
    url: options?.callbackUrl ?? "/",
  };
}

export async function signOut(options?: {
  redirect?: boolean;
  callbackUrl?: string;
}): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => {});

  window.dispatchEvent(new CustomEvent("si-cehat-auth-refresh"));

  if (options?.redirect !== false) {
    window.location.href = options?.callbackUrl || "/";
  }
}
