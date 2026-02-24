export default function usePmtilesUrl(guildId: string, mapId: string) {
  return `/api/guilds/${guildId}/maps/${mapId}/tiles`
}
