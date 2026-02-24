'use client'

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchGuilds, deleteGuild } from "@/lib/guilds"
import { fetchGuildsByUser } from "@/lib/users"
import OwnerChip from './OwnerChip'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Trash2 } from 'lucide-react'

export default function GuildsTable({ userId, isUserProfile = false }) {
  const queryClient = useQueryClient()

  const GUILDS_KEY = isUserProfile ? ['userGuilds', userId] : ['guilds', userId]

  const { data, error, isLoading } = useQuery({
    queryKey: GUILDS_KEY,
    queryFn: () => (isUserProfile ? fetchGuildsByUser(userId) : fetchGuilds()),
    refetchOnWindowFocus: false
  })

  const { mutate: deleteGuildMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteGuild,
    onMutate: async (guildId) => {
      await queryClient.cancelQueries({ queryKey: GUILDS_KEY })

      const previousGuilds = queryClient.getQueryData(GUILDS_KEY)

      queryClient.setQueryData(GUILDS_KEY, (oldGuilds: unknown[]) =>
        oldGuilds?.filter((guild: { id: string }) => guild.id !== guildId) || []
      )

      return { previousGuilds }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(GUILDS_KEY, context?.previousGuilds)
      console.error("Failed to delete guild:", err.message)
      alert("Failed to delete the guild. Please try again.")
    },
  })

  const handleDeleteClick = (e: React.MouseEvent, guildId: string) => {
    e.stopPropagation()
    e.preventDefault()
    deleteGuildMutate(guildId)
  }

  if (isLoading) return <p className="text-muted-foreground text-center py-8 col-span-full">Loading...</p>
  if (error) return <p className="text-destructive text-center py-8 col-span-full">Error: {error.message}</p>

  return (
    <>
      {data?.map((guild) => {
        const isOwner = guild.owner === userId

        return (
          <Link key={guild.id} href={`/guilds/${guild.guild_id}`} className="group">
            <GlassPanel
              coronaHover
              className="relative p-5 h-full flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-cinzel text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {guild.name}
                </h3>
                {isUserProfile && (
                  <button
                    onClick={(e) => handleDeleteClick(e, guild.id)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    aria-label="Delete guild"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-white/40">Owner:</span>
                <OwnerChip
                  userId={guild.owner}
                  isOwner={isOwner}
                  className="text-sm"
                />
              </div>

              {isOwner && !isUserProfile && (
                <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  Owner
                </span>
              )}
            </GlassPanel>
          </Link>
        )
      })}
    </>
  )
}
