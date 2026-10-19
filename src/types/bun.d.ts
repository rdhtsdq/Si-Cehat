declare namespace Bun {
  namespace password {
    function hash(
      password: string,
      options?: { algorithm?: "bcrypt" | "argon2id" | "argon2d" | "argon2i"; cost?: number }
    ): Promise<string>;
    function verify(password: string, hash: string): Promise<boolean>;
  }
}
