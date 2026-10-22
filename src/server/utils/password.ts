import bcrypt from "bcryptjs";

/**
 * Hashes a plaintext password using bcrypt.
 * Works seamlessly across both Bun and Node.js (Vite SSR) runtimes.
 */
export async function hashPassword(password: string): Promise<string> {
  const bunRuntime = (globalThis as unknown as { Bun?: { password?: { hash: (pw: string, opt: unknown) => Promise<string> } } }).Bun;

  if (typeof bunRuntime?.password?.hash === "function") {
    try {
      return await bunRuntime.password.hash(password, {
        algorithm: "bcrypt",
        cost: 10,
      });
    } catch {
      // Fallback to bcryptjs below
    }
  }

  return await bcrypt.hash(password, 10);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 * Works seamlessly across both Bun and Node.js (Vite SSR) runtimes.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;

  const bunRuntime = (globalThis as unknown as { Bun?: { password?: { verify: (pw: string, hash: string) => Promise<boolean> } } }).Bun;

  if (typeof bunRuntime?.password?.verify === "function") {
    try {
      const match = await bunRuntime.password.verify(password, hash);
      if (match) return true;
    } catch {
      // Fallback to bcryptjs below
    }
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
