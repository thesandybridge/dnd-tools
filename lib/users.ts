export async function updateUser(userId: string, data: Record<string, unknown>) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update user')
  return response.json()
}

export async function fetchUser(userId: string) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`Failed to fetch user ${userId}`)
  return response.json()
}

export async function fetchUsers() {
  const response = await fetch(`/api/users`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to fetch users')
  return response.json()
}

export async function fetchGuildsByUser(userId: string) {
  const response = await fetch(`/api/users/${userId}/guilds`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`Failed to fetch user guilds for user: ${userId}`)
  return response.json()
}

export async function deleteUser(userId: string) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to delete account')
  return response.json()
}

export async function fetchUsersPartial(take = 5, match: string) {
  const response = await fetch(`/api/users/partial?take=${take}&match=${match}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error('Failed to fetch users')
  return response.json()
}
