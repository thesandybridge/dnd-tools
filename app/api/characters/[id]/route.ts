import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeCharacter } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    const character = await prisma.character.findUniqueOrThrow({
      where: { id: parseInt(id, 10) },
    })

    if (character.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json(serializeCharacter(character))
  } catch (error) {
    console.error('Failed to fetch character:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    const existing = await prisma.character.findUniqueOrThrow({
      where: { id: parseInt(id, 10) },
    })

    if (existing.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowed = ['name', 'race', 'charClass', 'subclass', 'level', 'backstory', 'avatarUrl']
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const character = await prisma.character.update({
      where: { id: parseInt(id, 10) },
      data,
    })

    return Response.json(serializeCharacter(character))
  } catch (error) {
    console.error('Failed to update character:', (error as Error).message)
    return Response.json({ error: 'Failed to update character' }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    const existing = await prisma.character.findUniqueOrThrow({
      where: { id: parseInt(id, 10) },
    })

    if (existing.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.character.delete({ where: { id: parseInt(id, 10) } })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete character:', (error as Error).message)
    return Response.json({ error: 'Failed to delete character' }, { status: 500 })
  }
})
