import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const admin = supabaseAdmin();
          const { data, error } = await admin.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (error || !data.user) return null;

          // Upsert user in Prisma
          const user = await prisma.user.upsert({
            where: { email: data.user.email! },
            create: {
              email: data.user.email!,
              name: data.user.user_metadata?.name ?? null,
              image: data.user.user_metadata?.avatar_url ?? null,
            },
            update: {
              name: data.user.user_metadata?.name ?? undefined,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
          token.id = dbUser?.id || user.id;
          token.role = dbUser?.role || "USER";
        } else {
          token.id = user.id;
          token.role = (user as { role?: string }).role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
});
