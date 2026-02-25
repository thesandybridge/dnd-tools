"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "../providers/UserProvider"
import { fetchGuildsByUser } from "@/lib/users"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Shield, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Guilds() {
  const user = useUser()

  const { data: guilds = [], isLoading } = useQuery({
    queryKey: ['userGuilds', user.id],
    queryFn: () => fetchGuildsByUser(user.id),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading guilds...</p>

  if (guilds.length === 0) {
    return (
      <GlassPanel variant="subtle" className="w-full p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">No guild memberships yet</p>
        <Link href="/guilds" className="text-sm text-primary hover:underline">Browse guilds</Link>
      </GlassPanel>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {guilds.map((guild) => (
        <Link key={guild.guild_id} href={`/guilds/${guild.guild_id}`}>
          <GlassPanel coronaHover className="p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{guild.name}</p>
                {guild.is_owner && <Crown className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: guild.role.color, color: guild.role.color }}
                >
                  {guild.role.name}
                </Badge>
                <span className="text-xs text-muted-foreground">{guild.member_count} members</span>
              </div>
            </div>
          </GlassPanel>
        </Link>
      ))}
    </div>
  )
}
