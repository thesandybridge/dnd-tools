export interface GuildInvite {
  id: number
  guild_id: string
  guild: { guild_id: string; name: string }
  target_user_id: string
  invited_by: { id: string; name: string | null }
  message: string | null
  status: string
  expires_at: string
  created_at: string
}

export interface InvitableGuild {
  guild_id: string
  name: string
}

export async function createInvite(guildId: string, targetUserId: string, message?: string) {
  const response = await fetch(`/api/guilds/${guildId}/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId, message }),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || "Failed to create invite")
  }
  return response.json()
}

export async function fetchUserInvites(userId: string): Promise<GuildInvite[]> {
  const response = await fetch(`/api/users/${userId}/invites`)
  if (!response.ok) throw new Error("Failed to fetch invites")
  return response.json()
}

export async function respondToInvite(userId: string, inviteId: number, status: "accepted" | "declined") {
  const response = await fetch(`/api/users/${userId}/invites/${inviteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || "Failed to respond to invite")
  }
  return response.json()
}

export async function fetchInvitableGuilds(targetUserId: string): Promise<InvitableGuild[]> {
  const response = await fetch(`/api/members/${targetUserId}/invitable-guilds`)
  if (!response.ok) throw new Error("Failed to fetch invitable guilds")
  return response.json()
}
