'use client'

import { useState } from 'react'
import UserSearch from "@/app/components/users/UserSearch"
import { useGuild } from "../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function GuildAddMember({ userId }) {
  const { guildData, rolesData, getMemberRole } = useGuild()
  const actorRole = getMemberRole(userId)

  // Only show roles the actor outranks (position > actor's position)
  const assignableRoles = (rolesData || []).filter(r => actorRole && r.position > actorRole.position)

  // Default to the highest-position (lowest-rank) role
  const defaultRole = assignableRoles.length > 0 ? assignableRoles[assignableRoles.length - 1] : null
  const [selectedRoleId, setSelectedRoleId] = useState(defaultRole?.id?.toString() || '')

  return (
    <GlassPanel variant="subtle" className="p-6 w-full">
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-lg font-semibold font-cinzel">Add Member to Guild</h2>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger className="bg-white/[0.05] border-white/[0.08]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map(role => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                    {role.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <UserSearch
          guildData={guildData}
          roleId={selectedRoleId ? parseInt(selectedRoleId) : undefined}
          submitText="Add Member"
        />
      </div>
    </GlassPanel>
  )
}
