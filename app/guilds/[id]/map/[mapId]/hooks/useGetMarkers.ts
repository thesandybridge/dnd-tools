import { Marker, fetchMarkers } from "@/lib/markers"
import { UseQueryResult, useQuery } from "@tanstack/react-query"

export default function useGetMarkers(guildId: string, mapId: string): UseQueryResult<Marker[]> {
  return useQuery({
    queryKey: ["markers", guildId, mapId],
    queryFn: () => fetchMarkers(guildId, mapId),
  })
}
