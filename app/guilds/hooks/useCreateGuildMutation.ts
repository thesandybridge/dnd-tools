import { UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query";
import { Guild, createGuild } from "@/lib/guilds";
import { Dispatch, SetStateAction, useState } from "react";
import { uuid } from "@/utils/helpers";

interface CreateGuildInterface {
  formData: Guild,
  setFormData: Dispatch<SetStateAction<Guild>>,
  createGuild: (newGuild: Guild) => void,
  mutation: UseMutationResult<Guild>,
}

export default function useCreateGuildMutation(
  userId,
): CreateGuildInterface {
  const [formData, setFormData] = useState<Guild>({
    name: "",
    owner: userId,
    guild_id: uuid()
  })

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return createGuild(formData)
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['guilds', userId])

      const previousGuilds = queryClient.getQueryData<Guild[]>(['guilds', userId]) || []

      const optimisticGuild = { ...formData }
      queryClient.setQueryData(['guilds', userId], (oldGuilds = []) => [
        ...oldGuilds,
        optimisticGuild
      ])

      return { previousGuilds }
    },
    onError: (err, _, context) => {
      console.error("Error creating guild:", err.message)
      // Roll back to the previous state on error
      if (context?.previousGuilds) {
        queryClient.setQueryData(['guilds', userId], context.previousGuilds)
      }
    },
    onSuccess: (newGuild) => {
      queryClient.setQueryData(['guilds', userId], (oldGuilds = []) =>
        oldGuilds.map(guild =>
          guild.guild_id === formData.guild_id ? newGuild : guild
        )
      )
    },
    onSettled: () => {
      setFormData({ name: "", owner: userId, guild_id: uuid() })
    }
  });

  return {
    formData,
    setFormData,
    createGuild: (newGuild: Guild) => mutation.mutate(newGuild),
    mutation,
  }
}
