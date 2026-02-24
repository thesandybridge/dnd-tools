import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMember } from "@/lib/members"

interface AddMemberInterface {
  mutation: ReturnType<typeof useMutation>;
}

export default function useAddMemberMutation(guildData, roleId?: number): AddMemberInterface {
  const queryClient = useQueryClient();
  const key = ['guild', 'members', guildData.guild_id]

  const mutation = useMutation({
    mutationFn: async (newMember) => {
      if (!newMember || !newMember.id) {
        throw new Error('Invalid user selected')
      }
      return addMember(guildData.guild_id, newMember.id, roleId)
    },
    onMutate: async (newMember) => {
      await queryClient.cancelQueries(key)

      const previousMembers = queryClient.getQueryData(key) || []

      queryClient.setQueryData(key, (oldMembers = []) => [
        ...oldMembers,
        {
          guild_id: guildData.guild_id,
          user_id: newMember.id,
          role: { name: "Member", color: "#6b7280" },
          users: newMember
        }
      ])

      return { previousMembers }
    },
    onError: (err, _, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(key, context.previousMembers)
      }
      console.error("Error adding member:", err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries(key)
    }
  })

  return { mutation };
}
