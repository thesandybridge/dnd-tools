import { Marker, addMarker} from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useAddMarkerMutation(): UseMutationResult<Marker> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMarker,
    onMutate: async (newMarker) => {
      await queryClient.cancelQueries(['markers'])

      const previousMarkers = queryClient.getQueryData<Marker>(['markers']) || []

      queryClient.setQueryData(['markers'], [...previousMarkers, newMarker]);

      return newMarker
    },
    onSuccess: (savedMarker, variables) => {
      queryClient.setQueryData(['markers'], (oldMarkers = []) =>
        oldMarkers.map(marker => {
          return marker.uuid === variables.uuid
            ? { ...marker, uuid: savedMarker.uuid }
            : marker
          }
        )
      );
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['markers'], context.previousMarkers)
      console.error("Failed to add marker:", err.message)
    },
  })
}
