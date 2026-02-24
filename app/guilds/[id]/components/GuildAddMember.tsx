'use client'

import UserSearch from "@/app/components/users/UserSearch"
import { useGuild } from "../providers/GuildProvider"

export default function GuildAddMember() {
  const { guildData } = useGuild()

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="text-lg font-semibold">Add Member to Guild</h2>
      <UserSearch guildData={guildData} submitText="Add Member" />
    </div>
  )
}
