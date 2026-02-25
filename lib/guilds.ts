import { UUID } from "../utils/types"

export interface Guild {
  id: number,
  timestamp?: string,
  owner?: UUID,
  name: string,
  guild_id?: UUID,
  description?: string | null,
  visibility?: string,
  default_role_id?: number | null,
  request_expiry_days?: number | null,
}

export async function createGuild(guildData: Guild): Promise<Guild> {
  const response = await fetch(`/api/guilds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guildData })
  })
  if (!response.ok) throw new Error('Failed to create guild')
  return response.json()
}

export async function updateGuild(guildId: UUID, guildData: Partial<Guild>): Promise<Guild> {
  const response = await fetch(`/api/guilds/${guildId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guildData })
  })
  if (!response.ok) throw new Error('Failed to update guild')
  return response.json()
}

export async function fetchGuild(guildId: UUID): Promise<Guild> {
  const response = await fetch(`/api/guilds/${guildId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`Failed to fetch guild: ${guildId}`)
  return response.json()
}



export async function fetchGuilds(): Promise<Guild[]> {
  const response = await fetch(`/api/guilds`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to fetch guilds')
  return response.json()
}

export async function deleteGuild(guildId: UUID): Promise<Guild> {
  const response = await fetch(`/api/guilds/${guildId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`Failed to delete guild: ${guildId}`)
  return response.json()
}

export interface DiscoverGuild {
  id: number
  guild_id: string
  name: string
  description: string | null
  owner: { name: string | null }
  member_count: number
  has_pending_request: boolean
}

export interface DiscoverResponse {
  guilds: DiscoverGuild[]
  total: number
  page: number
  pages: number
}

export async function fetchDiscoverGuilds(search = "", page = 1): Promise<DiscoverResponse> {
  const params = new URLSearchParams({ search, page: String(page) })
  const response = await fetch(`/api/guilds/discover?${params}`)
  if (!response.ok) throw new Error("Failed to fetch discover guilds")
  return response.json()
}
