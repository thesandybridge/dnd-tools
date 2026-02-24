import { useQuery } from "@tanstack/react-query"
import { fetchGuildMap } from "@/lib/guild-maps"

export default function usePmtilesUrl(guildId: string, mapId: string) {
  return useQuery({
    queryKey: ["pmtiles-url", guildId, mapId],
    queryFn: async () => {
      const map = await fetchGuildMap(guildId, mapId)
      return map.pmtiles_url
    },
  })
}
