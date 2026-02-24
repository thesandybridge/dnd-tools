'use client'

import { useGuild } from "../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

export default function GuildBanner() {
  const { guildData } = useGuild()

  return (
    <GlassPanel corona className="w-full px-6 py-5">
      <h1 className="font-cinzel text-2xl font-bold text-foreground tracking-wide">
        {guildData.name}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Owner: {guildData.owner.name}
      </p>
    </GlassPanel>
  )
}
