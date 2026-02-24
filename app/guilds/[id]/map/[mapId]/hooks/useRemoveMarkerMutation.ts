import { Marker, removeMarker } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useRemoveMarkerMutation(guildId: string, mapId: string) {
  const queryClient = useQueryClient()
  const key = ["markers", guildId, mapId]

  return useMutation({
    mutationFn: (markerId: string) => removeMarker(guildId, mapId, markerId),
    onMutate: async (markerId) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Marker[]>(key)
      if (previous) {
        queryClient.setQueryData(key, previous.filter(m => m.uuid !== markerId))
      }
      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
  })
}
