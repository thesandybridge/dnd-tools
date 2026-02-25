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
}

const UserContext = createContext<UserData | null>(null)

export function UserProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { data, error, isLoading } = useQuery<UserData>({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  if (isLoading) return (
    <div className="flex flex-col gap-3 p-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-4 w-56" />
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
