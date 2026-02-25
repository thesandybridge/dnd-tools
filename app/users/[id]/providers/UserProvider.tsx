'use client'

import { createContext, useContext, type ReactNode } from "react"
import { fetchUser } from "@/lib/users"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

export interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  color: string | null
  bio: string | null
  theme_name: string
  theme_mode: string
  particle_effect: string
  corona_intensity: number
  timezone: string
  tileforge_connected: boolean
  tileforge_api_key_prefix: string | null
}

const UserContext = createContext<UserData | null>(null)

export function UserProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { data, error, isLoading } = useQuery<UserData>({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  if (isLoading) return (
    <div className="w-full flex flex-col gap-6 p-6">
      {/* Profile header area */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      {/* Content sections */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
  if (error) throw new Error(`Error: ${error.message}`)

  return (
    <UserContext.Provider value={data ?? null}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserData {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
