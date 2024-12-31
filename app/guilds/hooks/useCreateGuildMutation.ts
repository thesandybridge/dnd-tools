import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Guild, createGuild } from "@/lib/guilds";

interface CreateGuildInterface {
  mutation: ReturnType<typeof useMutation>;
}

export default function useCreateGuildMutation(userId: string): CreateGuildInterface {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newGuild: Guild) => {
      return createGuild(newGuild);
    },
    onMutate: async (newGuild) => {
      await queryClient.cancelQueries(['guilds', userId]);

      const previousGuilds = queryClient.getQueryData<Guild[]>(['guilds', userId]) || [];

      queryClient.setQueryData(['guilds', userId], (oldGuilds = []) => [
        ...oldGuilds,
        newGuild,
      ]);

      return { previousGuilds };
    },
    onError: (err, _, context) => {
      console.error("Error creating guild:", err.message);
      if (context?.previousGuilds) {
        queryClient.setQueryData(['guilds', userId], context.previousGuilds);
      }
    },
    onSuccess: (newGuild) => {
      queryClient.setQueryData(['guilds', userId], (oldGuilds = []) =>
        oldGuilds.map((guild) =>
          guild.guild_id === newGuild.guild_id ? newGuild : guild
        )
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries(['guilds', userId]);
    },
  });

  return { mutation };
}
