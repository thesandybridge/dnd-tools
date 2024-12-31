'use client'

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMember } from "@/lib/members"

interface DeleteMemberInterface {
  mutation: ReturnType<typeof useMutation>;
}

export default function useDeleteMemberMutation(guildData): DeleteMemberInterface {
  const queryClient = useQueryClient()
  const router = useRouter()
  const key = ['guild', 'members', guildData.guild_id]

  const mutation = useMutation({
    mutationFn: (memberId) => deleteMember(guildData.guild_id, memberId),
    onMutate: async (memberId) => {
      await queryClient.cancelQueries(key);
      const previousMembers = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (oldMembers = []) => {
        return oldMembers.filter(member => member.user_id !== memberId);
      });

      return { previousMembers };
    },
    onSettled: (data) => {
      if (data.redirect) {
        router.push('/guilds')
        queryClient.invalidateQueries('guild', userId)
      } else {
        queryClient.invalidateQueries('guild', 'members', guildData.guild_id)
      }
    },
    onError: (err, _, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(key, context.previousMembers)
      }
      console.error("Error deleting member:", err)
    }
  })

  return { mutation };
}
