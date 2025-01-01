'use client'

import { useRouter } from 'next/navigation'
import { deleteGuild } from "@/lib/guilds"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useGuild } from "../providers/GuildProvider"
import { Button } from '@mui/material'

export default function GuildSettings({userId}) {
  const queryClient = useQueryClient()
  const { guildData, isAdminOrOwner } = useGuild()
  const router = useRouter()

  if (!isAdminOrOwner(userId)) router.push(`/guilds/${guildData.guild_id}`)

  const { mutate: deleteGuildMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteGuild,
    onSuccess: () => {
      router.push('/guilds')
      queryClient.invalidateQueries('guilds')
      queryClient.invalidateQueries(['guild', userId])
    },
    onError: (err) => {
      console.error("Error deleting guild:", err)
    }
  })

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    deleteGuildMutate(guildData.guild_id)
  }

  return (
    <div>
      <h1>Settings</h1>
      <Button
        onClick={handleDeleteClick}
        disabled={isDeleting}
        variant='outlined'
        color='error'
      >
        {isDeleting ? 'Deleting Gulid...' : 'Delete Guild'}
      </Button>
    </div>
  )
}
