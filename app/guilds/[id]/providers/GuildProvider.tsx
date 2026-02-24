'use client'

import { createContext, useContext } from "react"
import { fetchGuild } from "@/lib/guilds"
import { fetchMembers } from "@/lib/members"
import { fetchRoles } from "@/lib/roles"
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

  const { data: rolesData, error: rolesError, isLoading: rolesLoading } = useQuery({
    queryKey: ['guild', 'roles', guildId],
    queryFn: () => fetchRoles(guildId)
  })

  if (guildLoading || membersLoading || rolesLoading) return <div>Loading guild data...</div>
  if (guildError) throw new Error(`Error loading guild: ${guildError.message}`)
  if (membersError) throw new Error(`Error loading members: ${membersError.message}`)
  if (rolesError) throw new Error(`Error loading roles: ${rolesError.message}`)

  const getMemberRole = (userId) => {
    const member = membersData.find(member => member.user_id === userId)
    return member?.role ?? null
  }

  const hasPermission = (userId, permission) => {
    const role = getMemberRole(userId)
    return role ? !!role[permission] : false
  }

  const isAdminOrOwner = (userId) => {
    return hasPermission(userId, 'manage_guild')
  }

  return (
    <GuildContext.Provider value={{ guildData, membersData, rolesData, hasPermission, getMemberRole, isAdminOrOwner }}>
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
