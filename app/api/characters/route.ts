import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeCharacter } from "@/lib/serializers"

export const GET = auth(async function GET(request) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const characters = await prisma.character.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(characters.map(serializeCharacter))
  } catch (error) {
    console.error('Failed to fetch characters:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
})

export const POST = auth(async function POST(request) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const count = await prisma.character.count({
      where: { userId: session.user.id },
    })
    if (count >= 20) {
      return Response.json({ error: 'Maximum 20 characters allowed' }, { status: 400 })
    }

    const body = await request.json()
    const character = await prisma.character.create({
      data: {
        userId: session.user.id!,
        name: body.name,
        race: body.race || null,
        charClass: body.charClass || null,
        subclass: body.subclass || null,
        level: body.level || 1,
        backstory: body.backstory || null,
      },
    })

    return Response.json(serializeCharacter(character), { status: 201 })
  } catch (error) {
    console.error('Failed to create character:', (error as Error).message)
    return Response.json({ error: 'Failed to create character' }, { status: 500 })
  }
})
