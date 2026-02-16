import Discord from "next-auth/providers/discord"
import type { NextAuthConfig } from "next-auth"

export default {
  providers: [Discord],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig
