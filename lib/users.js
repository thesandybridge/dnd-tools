export async function updateUser(userId, userData) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userData })
  })
  if (!response.ok) throw new Error('Failed to update user')
  return response.json()
}

export async function fetchUser(userId) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to update user')
  return response.json()
}
