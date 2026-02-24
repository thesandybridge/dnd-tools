export async function fetchMembers(guildId) {
  const response = await fetch(`/api/guilds/${guildId}/members`)
  if (!response.ok) throw new Error('Failed to fetch members')
  return response.json()
}

export async function deleteMember(guildId, memberId) {
  const response = await fetch(`/api/guilds/${guildId}/members/${memberId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error(`Failed to remove member: ${memberId}`)
  return response.json()
}

export async function updateMember(guildId, memberId, memberData) {
  const response = await fetch(`/api/guilds/${guildId}/members/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData)
  })
  if (!response.ok) throw new Error(`Failed to update member: ${memberId}`)
  return response.json()
}

export async function addMember(guildId, memberId, roleId?) {
  const body = roleId ? { memberId, roleId } : { memberId }
  const response = await fetch(`/api/guilds/${guildId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!response.ok) throw new Error('Failed to add member')
  return response.json()
}
