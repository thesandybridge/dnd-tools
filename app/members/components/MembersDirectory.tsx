'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMembersDirectory } from '@/lib/users'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Users } from 'lucide-react'
import MemberCard from './MemberCard'

export default function MembersDirectory() {
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['members-directory', searchQuery, page],
    queryFn: () => fetchMembersDirectory(searchQuery, page),
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
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </GlassPanel>
          ))}
        </div>
      </div>
    )
  }

  const members = data?.members ?? []
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
            placeholder="Search members..."
            className="pl-9 bg-white/[0.05] border-white/[0.08]"
          />
        </div>
        <Button type="submit" size="sm" className="cursor-pointer">Search</Button>
      </form>

      {/* Empty state */}
      {members.length === 0 && (
        <GlassPanel variant="subtle" className="p-8 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'No members found matching your search' : 'No members yet'}
          </p>
        </GlassPanel>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
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
            onClick={() => setPage((p) => p + 1)}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
