import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuild } from "@/lib/serializers"

export const GET = auth(async function GET(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const guilds = await prisma.guild.findMany()

    return Response.json(guilds.map(serializeGuild))
  } catch (error) {
    console.error('Failed to fetch guilds:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch guilds',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const POST = auth(async function POST(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guildData } = await request.json()

    const guild = await prisma.guild.create({
      data: {
        name: guildData.name,
        ownerId: guildData.owner,
        members: {
          create: {
            userId: guildData.owner,
            role: 'owner',
          },
        },
      },
    })

    return Response.json(serializeGuild(guild))
  } catch (error) {
    console.error('Failed to add guild:', (error as Error).message)
    return Response.json({
      error: 'Failed to add guild',
      details: (error as Error).message
    }, { status: 500 })
  }
})
