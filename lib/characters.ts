export async function fetchCharacters() {
  const response = await fetch('/api/characters')
  if (!response.ok) throw new Error('Failed to fetch characters')
  return response.json()
}

export async function fetchCharacter(id: number) {
  const response = await fetch(`/api/characters/${id}`)
  if (!response.ok) throw new Error('Failed to fetch character')
  return response.json()
}

export async function createCharacter(data: {
  name: string
  race?: string
  charClass?: string
  subclass?: string
  level?: number
  backstory?: string
}) {
  const response = await fetch('/api/characters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create character')
  return response.json()
}

export async function updateCharacter(id: number, data: Record<string, unknown>) {
  const response = await fetch(`/api/characters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update character')
  return response.json()
}

export async function deleteCharacter(id: number) {
  const response = await fetch(`/api/characters/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete character')
  return response.json()
}
