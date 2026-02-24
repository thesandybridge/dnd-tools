'use client'

import { useRouter } from 'next/navigation'
import { deleteGuild } from "@/lib/guilds"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useGuild } from "../providers/GuildProvider"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      <h1 className="text-xl font-bold">Settings</h1>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete this guild and all its data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? 'Deleting Guild...' : 'Delete Guild'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
