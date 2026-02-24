import { UUID } from "@/utils/types"

export interface Position {
  lat: string
  lng: string
}

export interface Marker {
  id: number
  uuid: UUID
  created_at?: string
  user_id?: UUID
  prev_marker?: number | null
  position?: Position
  distance?: string | number
  text?: string
}

export async function fetchMarkers(guildId: UUID, mapId: UUID): Promise<Marker[]> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return response.json()
}

export async function addMarker(guildId: UUID, mapId: UUID, marker: Marker): Promise<Marker> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marker),
  })
  if (!response.ok) throw new Error('Failed to add marker')
  return response.json()
}

export async function removeMarker(guildId: UUID, mapId: UUID, markerId: UUID): Promise<Marker> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers/${markerId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to remove marker')
  return response.json()
}

export async function updateMarkerDistance(guildId: UUID, mapId: UUID, markerId: UUID, newDistance: number): Promise<Marker> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers/${markerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ distance: newDistance }),
  })
  if (!response.ok) throw new Error('Failed to update marker distance')
  return response.json()
}

export async function updateMarkerText(guildId: UUID, mapId: UUID, markerUuid: UUID, text: string): Promise<void> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers/${markerUuid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error('Failed to update marker text')
}
