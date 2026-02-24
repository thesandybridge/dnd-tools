import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuildMap } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id as string, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const maps = await prisma.guildMap.findMany({
      where: { guildId: guild_id as string },
    })

    return Response.json(maps.map(serializeGuildMap))
  } catch (error) {
    console.error('Failed to fetch guild maps:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch guild maps',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params

    const guild = await prisma.guild.findUnique({ where: { guildId: guild_id as string } })
    if (!guild || guild.ownerId !== session.user.id) {
      return Response.json({ error: "Only guild owner can do this" }, { status: 403 })
    }

    const { name, tileforgeSlug, tileforgeKey } = await request.json()

    const map = await prisma.guildMap.create({
      data: {
        guildId: guild_id as string,
        name,
        tileforgeSlug,
        tileforgeKey,
      },
    })

    return Response.json(serializeGuildMap(map), { status: 201 })
  } catch (error) {
    console.error('Failed to create guild map:', (error as Error).message)
    return Response.json({
      error: 'Failed to create guild map',
      details: (error as Error).message
    }, { status: 500 })
  }
})
