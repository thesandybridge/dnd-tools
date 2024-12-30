'use client'

import { useGuild } from "../providers/GuildProvider"

export default function GuildBanner() {
  const { guildData } = useGuild()

  return (
    <div>
      <h1>{guildData.name}</h1>
      <p>Owner: {guildData.owner.name}</p>
    </div>
  )
}
