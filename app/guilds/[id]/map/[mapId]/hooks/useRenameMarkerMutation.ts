import { Marker, updateMarkerText } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useRenameMarkerMutation(guildId: string, mapId: string) {
  const queryClient = useQueryClient()
  const key = ["markers", guildId, mapId]

  return useMutation({
    mutationFn: ({ uuid, text }: { uuid: string; text: string }) =>
      updateMarkerText(guildId, mapId, uuid, text),
    onMutate: async ({ uuid, text }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Marker[]>(key)
      queryClient.setQueryData(key, (old: Marker[] = []) =>
        old.map(m => m.uuid === uuid ? { ...m, text } : m)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
  })
}
