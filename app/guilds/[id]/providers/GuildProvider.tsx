'use client'

import { createContext, useContext } from "react"
import { fetchGuild } from "@/lib/guilds"
import { fetchMembers } from "@/lib/members"
import { useQuery } from "@tanstack/react-query"

const GuildContext = createContext(null)

export function GuildProvider({ guildId, children }) {
  const { data: guildData, error: guildError, isLoading: guildLoading } = useQuery({
    queryKey: ['guild', guildId],
    queryFn: () => fetchGuild(guildId)
  })

  const { data: membersData, error: membersError, isLoading: membersLoading } = useQuery({
    queryKey: ['guild', 'members', guildId],
    queryFn: () => fetchMembers(guildId)
  })

  if (guildLoading || membersLoading) return <div>Loading guild data...</div>
  if (guildError) throw new Error(`Error loading guild: ${guildError.message}`)
  if (membersError) throw new Error(`Error loading members: ${membersError.message}`)

  const isAdminOrOwner = (userId) => {
    const member = membersData.find(member => member.user_id === userId)
    return member && ['admin', 'owner'].includes(member.role)
  }

  return (
    <GuildContext.Provider value={{ guildData, membersData, isAdminOrOwner }}>
      {children}
    </GuildContext.Provider>
  )
}

export function useGuild() {
  const context = useContext(GuildContext)
  if (!context) {
    throw new Error("useGuild must be used within a GuildProvider")
  }
  return context
}
