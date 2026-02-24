export async function fetchRoles(guildId) {
  const response = await fetch(`/api/guilds/${guildId}/roles`)
  if (!response.ok) throw new Error('Failed to fetch roles')
  return response.json()
}

export async function createRole(guildId, roleData) {
  const response = await fetch(`/api/guilds/${guildId}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData)
  })
  if (!response.ok) throw new Error('Failed to create role')
  return response.json()
}

export async function updateRole(guildId, roleId, roleData) {
  const response = await fetch(`/api/guilds/${guildId}/roles/${roleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleData)
  })
  if (!response.ok) throw new Error(`Failed to update role: ${roleId}`)
  return response.json()
}

export async function deleteRole(guildId, roleId) {
  const response = await fetch(`/api/guilds/${guildId}/roles/${roleId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error(`Failed to delete role: ${roleId}`)
  return response.json()
}
