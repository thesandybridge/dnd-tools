"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { updateUser } from "@/lib/users"

export function useTimezoneSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected && detected !== "UTC") {
      updateUser(session.user.id, { timezone: detected }).catch(() => {})
    }
  }, [session?.user?.id])
}
