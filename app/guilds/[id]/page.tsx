'use client'

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Users, Map } from "lucide-react"
import { useGuild } from "./providers/GuildProvider"
import { fetchGuildMaps } from "@/lib/guild-maps"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Badge } from "@/components/ui/badge"

export default function GuildOverview() {
  const { id: guildId } = useParams<{ id: string }>()
  const { guildData, membersData } = useGuild()

  const { data: maps = [] } = useQuery({
    queryKey: ["guild-maps", guildId],
    queryFn: () => fetchGuildMaps(guildId),
  })

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link href={`/guilds/${guildId}/members`} className="group">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-primary" />
            <h2 className="font-cinzel text-lg font-semibold group-hover:text-primary transition-colors">
              Members
            </h2>
            <span className="text-sm text-muted-foreground">({membersData.length})</span>
          </div>
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {membersData.map((member) => (
            <GlassPanel key={member.user_id} variant="subtle" className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate">
                {member.users?.name}
              </span>
              <Badge className="shrink-0 ml-2 text-white" style={{ backgroundColor: member.role.color }}>
                {member.role.name}
              </Badge>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section>
        <Link href={`/guilds/${guildId}/map`} className="group">
          <div className="flex items-center gap-2 mb-3">
            <Map size={18} className="text-primary" />
            <h2 className="font-cinzel text-lg font-semibold group-hover:text-primary transition-colors">
              Maps
            </h2>
            <span className="text-sm text-muted-foreground">({maps.length})</span>
          </div>
        </Link>
        {maps.length === 0 ? (
          <GlassPanel variant="subtle" className="p-8 text-center">
            <Map className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No maps yet</p>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {maps.map((map) => (
              <Link key={map.map_id} href={`/guilds/${guildId}/map/${map.map_id}`}>
                <GlassPanel coronaHover className="p-4 cursor-pointer transition-all hover:scale-[1.02]">
                  <div className="flex items-center gap-2">
                    <Map size={16} className="shrink-0 text-primary" />
                    <span className="font-cinzel text-sm font-medium truncate">{map.name}</span>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
