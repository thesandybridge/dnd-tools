'use client'

import UserSearch from "@/app/components/users/UserSearch"
import { useGuild } from "../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

export default function GuildAddMember() {
  const { guildData } = useGuild()

  return (
    <GlassPanel variant="subtle" className="p-6 w-full">
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-lg font-semibold font-cinzel">Add Member to Guild</h2>
        <UserSearch guildData={guildData} submitText="Add Member" />
      </div>
    </GlassPanel>
  )
}
