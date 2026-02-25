'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDiscoverGuilds, type DiscoverGuild } from '@/lib/guilds'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Users, Compass } from 'lucide-react'
import JoinRequestDialog from './JoinRequestDialog'

export default function DiscoverGrid() {
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedGuild, setSelectedGuild] = useState<DiscoverGuild | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['discover-guilds', searchQuery, page],
    queryFn: () => fetchDiscoverGuilds(searchQuery, page),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(search)
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassPanel key={i} className="p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-8 w-28" />
            </GlassPanel>
          ))}
        </div>
      </div>
    )
  }

  const guilds = data?.guilds ?? []
  const pages = data?.pages ?? 1

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guilds..."
            className="pl-9 bg-white/[0.05] border-white/[0.08]"
          />
        </div>
        <Button type="submit" size="sm" className="cursor-pointer">Search</Button>
      </form>

      {/* Empty state */}
      {guilds.length === 0 && (
        <GlassPanel variant="subtle" className="p-8 text-center">
          <Compass className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'No guilds found matching your search' : 'No public guilds available yet'}
          </p>
        </GlassPanel>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {guilds.map((guild) => (
          <GlassPanel key={guild.guild_id} coronaHover className="p-5 flex flex-col gap-3">
            <h3 className="font-cinzel text-lg font-semibold truncate">{guild.name}</h3>
            {guild.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{guild.description}</p>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {guild.member_count} {guild.member_count === 1 ? 'member' : 'members'}
              </span>
              {guild.owner.name && (
                <span className="text-white/40">by {guild.owner.name}</span>
              )}
            </div>
            <div className="mt-auto pt-2">
              {guild.has_pending_request ? (
                <Button size="sm" variant="secondary" disabled className="cursor-not-allowed">
                  Request Pending
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setSelectedGuild(guild)}
                >
                  Request to Join
                </Button>
              )}
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage(p => p + 1)}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}

      {/* Join Request Dialog */}
      {selectedGuild && (
        <JoinRequestDialog
          guild={selectedGuild}
          open={!!selectedGuild}
          onOpenChange={(open) => { if (!open) setSelectedGuild(null) }}
        />
      )}
    </div>
  )
}
