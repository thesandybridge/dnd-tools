import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import jwt from "jsonwebtoken"

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
            const signingSecret = process.env.SUPABASE_JWT_SECRET
            if (signingSecret) {
                const payload = {
                    aud: "authenticated",
                    exp: Math.floor(new Date(session.expires).getTime() / 1000),
                    sub: user.id,
                    email: user.email,
                    role: "authenticated",
                }
                session.supabaseAccessToken = jwt.sign(payload, signingSecret)
            }
            return session
        },
    },
})
