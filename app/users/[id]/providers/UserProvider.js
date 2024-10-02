'use client'

import { createContext, useContext } from "react"
import { fetchUser } from "@/lib/users"
import { useQuery } from "@tanstack/react-query"

const UserContext = createContext(null)

export function UserProvider({ userId, children }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  if (isLoading) return <div>Loading user data...</div>
  if (error) throw new Error(`Error: ${error.message}`)

  return (
    <UserContext.Provider value={data}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
