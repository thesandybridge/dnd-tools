'use client'

import { createContext, useContext } from "react"
import { fetchGuild } from "@/lib/guilds"
import { fetchMembers } from "@/lib/members"
import { fetchRoles } from "@/lib/roles"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

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

  if (guildLoading || membersLoading || rolesLoading) return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <Skeleton className="h-7 w-48" />
      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col gap-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
      {/* Activity rows */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
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
