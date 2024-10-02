'use client'

import { useRouter } from 'next/navigation'
import { deleteGuild } from "@/lib/guilds"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useGuild } from "../providers/GuildProvider"

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
        <button
          onClick={handleDeleteClick}
          className="danger"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting Gulid...' : 'Delete Guild'}
        </button>
    </div>
  )
}
