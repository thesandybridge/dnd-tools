import { UUID } from "@/utils/types"

export interface GuildMap {
  id: number
  map_id: UUID
  guild_id: UUID
  name: string
  pmtiles_url: string
  created_at?: string
  updated_at?: string
}

export async function fetchGuildMaps(guildId: UUID): Promise<GuildMap[]> {
  const response = await fetch(`/api/guilds/${guildId}/maps`)
  if (!response.ok) throw new Error(`Failed to fetch guild maps`)
  return response.json()
}

export async function fetchGuildMap(guildId: UUID, mapId: UUID): Promise<GuildMap> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}`)
  if (!response.ok) throw new Error(`Failed to fetch guild map`)
  return response.json()
}

export async function createGuildMap(guildId: UUID, data: { name: string; pmtilesUrl: string }): Promise<GuildMap> {
  const response = await fetch(`/api/guilds/${guildId}/maps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create guild map')
  return response.json()
}

export async function updateGuildMap(guildId: UUID, mapId: UUID, data: { name?: string; pmtilesUrl?: string }): Promise<GuildMap> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update guild map')
  return response.json()
}

export async function deleteGuildMap(guildId: UUID, mapId: UUID): Promise<void> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete guild map')
}
