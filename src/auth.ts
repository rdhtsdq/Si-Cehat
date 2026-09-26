import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const guardian = await db.guardian.findUnique({
          where: { email: credentials.email as string },
        });

        if (!guardian) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          guardian.passwordHash
        );

        if (passwordsMatch) {
          return {
            id: guardian.id,
            email: guardian.email,
            role: guardian.role,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "GUARDIAN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id || token.sub) as string;
        session.user.role = (token.role as string) || "GUARDIAN";
      }
      return session;
    },
  },
  pages: {
    signIn: "/parent/login",
  },
});
