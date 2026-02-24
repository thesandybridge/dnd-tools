import { useQuery } from "@tanstack/react-query"
import { fetchPmtilesUrl } from "@/lib/guild-maps"

export default function usePmtilesUrl(guildId: string, mapId: string) {
  return useQuery({
    queryKey: ["pmtiles-url", guildId, mapId],
    queryFn: () => fetchPmtilesUrl(guildId, mapId),
    refetchInterval: 8 * 60 * 1000,
    staleTime: 7 * 60 * 1000,
  })
}
