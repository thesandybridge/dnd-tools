import { Marker, addMarker } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useAddMarkerMutation(guildId: string, mapId: string) {
  const queryClient = useQueryClient()
  const key = ["markers", guildId, mapId]

  return useMutation({
    mutationFn: (marker: unknown) => addMarker(guildId, mapId, marker as Marker),
    onMutate: async (newMarker) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Marker[]>(key) || []
      queryClient.setQueryData(key, [...previous, newMarker])
      return { previous }
    },
    onSuccess: (saved, variables) => {
      queryClient.setQueryData(key, (old: Marker[] = []) =>
        old.map(m => m.uuid === (variables as Marker).uuid ? { ...m, uuid: saved.uuid } : m)
      )
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
  })
}
