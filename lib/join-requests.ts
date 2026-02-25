import { UUID } from "@/utils/types"

export interface JoinRequest {
  id: number
  guild_id: string
  user_id: string
  user: { id: string; name: string | null; image: string | null }
  message: string | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  expires_at: string | null
  created_at: string
}

export async function submitJoinRequest(guildId: UUID, message?: string) {
  const response = await fetch(`/api/guilds/${guildId}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || "Failed to submit request")
  }
  return response.json()
}

export async function fetchJoinRequests(guildId: UUID, status?: string) {
  const params = status ? `?${new URLSearchParams({ status })}` : ""
  const response = await fetch(`/api/guilds/${guildId}/requests${params}`)
  if (!response.ok) throw new Error("Failed to fetch requests")
  return response.json() as Promise<JoinRequest[]>
}

export async function reviewJoinRequest(guildId: UUID, requestId: number, status: "approved" | "denied") {
  const response = await fetch(`/api/guilds/${guildId}/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error("Failed to review request")
  return response.json()
}
