"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { updateUser } from "@/lib/users"

export function useTimezoneSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!detected || detected === "UTC") return

    const key = `tz-synced-${session.user.id}`
    if (localStorage.getItem(key) === detected) return

    updateUser(session.user.id, { timezone: detected })
      .then(() => localStorage.setItem(key, detected))
      .catch(() => {})
  }, [session?.user?.id])
}
