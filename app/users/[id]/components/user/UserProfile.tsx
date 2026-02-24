"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "../../providers/UserProvider"
import { fetchGuildsByUser } from "@/lib/users"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Shield } from "lucide-react"

export default function UserProfile() {
  const user = useUser()

  const { data: guilds = [], isLoading } = useQuery({
    queryKey: ['userGuilds', user.id],
    queryFn: () => fetchGuildsByUser(user.id),
    refetchOnWindowFocus: false,
  })

  return (
    <div className="w-full flex flex-col gap-6">
      <h2 className="font-cinzel text-lg font-semibold">Guild Memberships</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading guilds...</p>
      ) : guilds.length === 0 ? (
        <GlassPanel variant="subtle" className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">No guild memberships yet</p>
          <Link href="/guilds" className="text-sm text-primary hover:underline">Browse guilds</Link>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild) => (
            <Link key={guild.guild_id} href={`/guilds/${guild.guild_id}`}>
              <GlassPanel coronaHover className="p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
                <Shield className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{guild.name}</p>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
