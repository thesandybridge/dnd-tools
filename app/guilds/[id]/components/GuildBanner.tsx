'use client'

import { useGuild } from "../providers/GuildProvider"

export default function GuildBanner() {
  const { guildData } = useGuild()

  return (
    <div className="flex flex-col gap-1 py-4">
      <h1 className="text-2xl font-bold text-foreground">{guildData.name}</h1>
      <p className="text-sm text-muted-foreground">Owner: {guildData.owner.name}</p>
    </div>
  )
}
