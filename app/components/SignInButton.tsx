"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export function SignInButton() {
  return (
    <Button size="lg" onClick={() => signIn("discord")} className="gap-2">
      <LogIn className="h-4 w-4" />
      Sign in with Discord
    </Button>
  )
}
