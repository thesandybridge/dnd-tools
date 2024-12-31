'use client'

import UserSearch from "@/app/components/users/UserSearch"
import { useGuild } from "../providers/GuildProvider"

export default function GuildAddMember() {
  const { guildData } = useGuild()

  return (
    <>
      <h2>Add Member to Guild</h2>
      <UserSearch guildData={guildData} submitText="Add Member" />
    </>
  )
}
