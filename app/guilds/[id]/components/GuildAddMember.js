'use client'

import UserSearch from "@/app/components/users/UserSearch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useGuild } from "../providers/GuildProvider"
import { addMember } from "@/lib/members"

export default function GuildAddMember() {
  const { guildData } = useGuild()
  const queryClient = useQueryClient()

  const { mutate: addMemberMutate, isLoading: isAdding, error } = useMutation({
    mutationFn: async (newMember) => {
      if (!newMember || !newMember.id) {
        throw new Error('Invalid user selected')
      }
      return addMember(guildData.guild_id, newMember.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['guild', 'members', guildData.guild_id])
    },
    onError: (err) => {
      console.error("Error adding member:", err)
    }
  })

  const handleSubmit = (selectedUser) => {
    if (selectedUser && selectedUser.id) {
      addMemberMutate(selectedUser)
    } else {
      console.error('No valid user selected')
    }
  }

  return (
    <div>
      <h2>Add Member to Guild</h2>
      <UserSearch onSubmit={handleSubmit} submitText="Add Member" />
      {isAdding && <p>Adding member...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </div>
  )
}
