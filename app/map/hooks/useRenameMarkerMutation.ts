import { Marker, updateMarkerText } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useRenameMarkerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, text }: { uuid: string; text: string }) =>
      updateMarkerText(uuid, text),
    onMutate: async ({ uuid, text }) => {
      await queryClient.cancelQueries(['markers'])
      const previous = queryClient.getQueryData<Marker[]>(['markers'])

      queryClient.setQueryData(['markers'], (old: Marker[] = []) =>
        old.map(m => m.uuid === uuid ? { ...m, text } : m)
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['markers'], context?.previous)
    },
  })
}
