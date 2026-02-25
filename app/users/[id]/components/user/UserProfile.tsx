"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "../../providers/UserProvider"
import { fetchGuildsByUser } from "@/lib/users"
import { fetchCharacters } from "@/lib/characters"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Shield, Crown, Sword, Plus } from "lucide-react"
import ActivityFeed from "@/app/components/ActivityFeed"

export default function UserProfile() {
  const user = useUser()

  const { data: characters = [], isLoading: charsLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const { data: guilds = [], isLoading: guildsLoading } = useQuery({
    queryKey: ['userGuilds', user.id],
    queryFn: () => fetchGuildsByUser(user.id),
    refetchOnWindowFocus: false,
  })

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Character Roster */}
      <section>
        <h2 className="font-cinzel text-lg font-semibold mb-4">Character Roster</h2>
        {charsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 w-48 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto snap-x pb-2">
            {characters.map((char) => (
              <Link key={char.id} href={`/characters/${char.id}`} className="shrink-0 snap-start">
                <GlassPanel coronaHover className="w-48 p-4 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Sword className="h-4 w-4 text-primary" />
                    {char.level && (
                      <Badge variant="outline" className="text-xs">
                        Lv {char.level}
                      </Badge>
                    )}
                  </div>
                  <p className="font-cinzel font-medium truncate">{char.name}</p>
                  {(char.race || char.class) && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {[char.race, char.class].filter(Boolean).join(" ")}
                    </p>
                  )}
                </GlassPanel>
              </Link>
            ))}
            <Link href="/characters" className="shrink-0 snap-start">
              <GlassPanel coronaHover className="w-48 p-4 h-full flex flex-col items-center justify-center gap-2 hover:bg-white/[0.03] transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Add Character</p>
              </GlassPanel>
            </Link>
          </div>
        )}
      </section>

      {/* Guild Memberships */}
      <section>
        <h2 className="font-cinzel text-lg font-semibold mb-4">Guild Memberships</h2>
        {guildsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{guild.name}</p>
                      {guild.is_owner && <Crown className="h-4 w-4 text-yellow-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {guild.role && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: guild.role.color, color: guild.role.color }}
                        >
                          {guild.role.name}
                        </Badge>
                      )}
                      {guild.member_count != null && (
                        <span className="text-xs text-muted-foreground">
                          {guild.member_count} {guild.member_count === 1 ? 'member' : 'members'}
                        </span>
                      )}
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="font-cinzel text-lg font-semibold mb-4">Recent Activity</h2>
        <GlassPanel variant="subtle" className="p-6">
          <ActivityFeed limit={10} />
        </GlassPanel>
      </section>
    </div>
  )
}
