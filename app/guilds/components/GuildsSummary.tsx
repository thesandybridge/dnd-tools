'use client'

import Link from 'next/link'
import { useQuery } from "@tanstack/react-query"
import { fetchGuilds } from "@/lib/guilds"
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield } from 'lucide-react'

export default function GuildsSummary({ userId }: { userId: string }) {
  const { data: guilds = [], isLoading } = useQuery({
    queryKey: ['guilds', userId],
    queryFn: fetchGuilds,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassPanel key={i} className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </GlassPanel>
        ))}
      </div>
    )
  }

  const topGuilds = guilds.slice(0, 4)

  if (topGuilds.length === 0) {
    return (
      <GlassPanel variant="subtle" className="p-8 text-center">
        <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No guilds yet</p>
        <Link href="/guilds/my" className="text-sm text-primary hover:underline mt-1 inline-block">
          Create your first guild
        </Link>
      </GlassPanel>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {topGuilds.map((guild) => (
        <Link key={guild.guild_id} href={`/guilds/${guild.guild_id}`}>
          <GlassPanel coronaHover className="p-4 transition-all hover:scale-[1.02]">
            <h3 className="font-cinzel text-sm font-semibold truncate">{guild.name}</h3>
            {guild.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{guild.description}</p>
            )}
          </GlassPanel>
        </Link>
      ))}
    </div>
  )
}
