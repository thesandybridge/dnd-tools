import { Marker, removeMarker } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useRemoveMarkerMutation(): UseMutationResult<Marker> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMarker,
    onMutate: async (markerId) => {
      await queryClient.cancelQueries(['markers'])

      const previousMarkers = queryClient.getQueryData<Marker[]>(['markers'])
      if (!previousMarkers) return { previousMarkers };

      // Optimistically update the markers by removing the deleted marker
      const updatedMarkers = previousMarkers.filter(marker => marker.uuid !== markerId)

      // Check if we need to update the marker relationships (prev_marker, distance)
      const markerToRemove = previousMarkers.find(marker => marker.uuid === markerId)
      const affectedMarker = previousMarkers.find(marker => marker.prev_marker === markerId)

      if (affectedMarker && markerToRemove) {
        const newPrevMarker = previousMarkers.find(marker => marker.uuid === markerToRemove.prev_marker)

        // Update the affected marker's distance and prev_marker
        const updatedDistance = newPrevMarker
          ? calculateDistance(newPrevMarker.position, affectedMarker.position)
          : "Start"

        // Update the affected marker
        queryClient.setQueryData(['markers'], updatedMarkers.map(marker =>
          marker.uuid === affectedMarker.uuid
            ? { ...marker, prev_marker: markerToRemove.prev_marker, distance: updatedDistance }
            : marker
        ))

        updateMarkerDistance(affectedMarker.id, updatedDistance)
      } else {
        queryClient.setQueryData(['markers'], updatedMarkers)
      }

      return { previousMarkers }
    },
    onError: (err, markerId, context) => {
      queryClient.setQueryData(['markers'], context.previousMarkers)
      console.error(`Failed to remove marker: ${markerId}`, err.message)
    },
  })
}
