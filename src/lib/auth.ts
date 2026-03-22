import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";

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
          if (!admin) {
            console.error("[AUTH] supabaseAdmin initialized as null - check SUPABASE_SERVICE_ROLE_KEY");
            return null;
          }

          console.log("[AUTH] Attempting login for:", credentials.email);
          const { data, error } = await admin.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (error) {
            console.error("[AUTH] Supabase error:", error.message);
            return null;
          }

          if (!data.user) {
            console.error("[AUTH] No user data returned");
            return null;
          }

          // Upsert user in Supabase
          const { data: user, error: upsertError } = await admin
            .from('User')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name ?? null,
              image: data.user.user_metadata?.avatar_url ?? null,
              updatedAt: new Date().toISOString(),
            }, { onConflict: 'email' })
            .select()
            .single();

          if (upsertError || !user) {
            console.error("[AUTH] Upsert error:", upsertError?.message);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (err: any) {
          console.error("[AUTH] Unexpected error:", err?.message || err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const admin = supabaseAdmin();
        
        // Find existing user or generate new ID
        const { data: dbUser } = await admin
          .from('User')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        await admin
          .from('User')
          .upsert({
            id: dbUser?.id || crypto.randomUUID(),
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            updatedAt: new Date().toISOString(),
            ...(dbUser ? {} : { createdAt: new Date().toISOString() }),
          }, { onConflict: 'email' });
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const admin = supabaseAdmin();
          const { data: dbUser } = await admin
            .from('User')
            .select()
            .eq('email', user.email!)
            .single();
            
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
