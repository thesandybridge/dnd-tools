'use client'

import { useRouter } from 'next/navigation'
import { deleteGuild } from "@/lib/guilds"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useGuild } from "../providers/GuildProvider"
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { AlertTriangle } from 'lucide-react'

export default function GuildSettings({userId}) {
  const queryClient = useQueryClient()
  const { guildData, isAdminOrOwner } = useGuild()
  const router = useRouter()

  if (!isAdminOrOwner(userId)) router.push(`/guilds/${guildData.guild_id}`)

  const { mutate: deleteGuildMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteGuild,
    onSuccess: () => {
      router.push('/guilds')
      queryClient.invalidateQueries({ queryKey: ['guilds'] })
      queryClient.invalidateQueries({ queryKey: ['guild', userId] })
    },
    onError: (err) => {
      console.error("Error deleting guild:", err)
    }
  })

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    deleteGuildMutate(guildData.guild_id)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold font-cinzel">Settings</h1>
      <GlassPanel className="border-destructive/30 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete this guild and all its data.
            </p>
          </div>
          <div>
            <Button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Deleting Guild...' : 'Delete Guild'}
            </Button>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
