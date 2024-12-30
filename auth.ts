import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { SignJWT } from "jose";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
  callbacks: {
    async session({ session, user }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET;

      if (signingSecret) {
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(signingSecret);

        const token = await new SignJWT({
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user.id,
          email: user.email,
          role: "authenticated",
        })
          .setProtectedHeader({ alg: "HS256" })
          .sign(secretKey);

        session.supabaseAccessToken = token;
      }

      return session;
    },
  },
})
