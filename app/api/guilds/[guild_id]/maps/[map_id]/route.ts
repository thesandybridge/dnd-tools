import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuildMap } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id as string, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const map = await prisma.guildMap.findFirst({
      where: { mapId: map_id as string, guildId: guild_id as string },
    })
    if (!map) {
      return Response.json({ error: "Map not found" }, { status: 404 })
    }

    return Response.json(serializeGuildMap(map))
  } catch (error) {
    console.error('Failed to fetch guild map:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch guild map',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const guild = await prisma.guild.findUnique({ where: { guildId: guild_id as string } })
    if (!guild || guild.ownerId !== session.user.id) {
      return Response.json({ error: "Only guild owner can do this" }, { status: 403 })
    }

    const { name, pmtilesUrl, pmtilesApiKey, imageWidth, imageHeight, maxZoom } = await request.json()

    const map = await prisma.guildMap.update({
      where: { mapId: map_id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(pmtilesUrl !== undefined && { pmtilesUrl }),
        ...(pmtilesApiKey !== undefined && { pmtilesApiKey }),
        ...(imageWidth !== undefined && { imageWidth }),
        ...(imageHeight !== undefined && { imageHeight }),
        ...(maxZoom !== undefined && { maxZoom }),
      },
    })

    return Response.json(serializeGuildMap(map))
  } catch (error) {
    console.error('Failed to update guild map:', (error as Error).message)
    return Response.json({
      error: 'Failed to update guild map',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const guild = await prisma.guild.findUnique({ where: { guildId: guild_id as string } })
    if (!guild || guild.ownerId !== session.user.id) {
      return Response.json({ error: "Only guild owner can do this" }, { status: 403 })
    }

    await prisma.guildMap.delete({
      where: { mapId: map_id as string },
    })

    return Response.json(null)
  } catch (error) {
    console.error('Failed to delete guild map:', (error as Error).message)
    return Response.json({
      error: 'Failed to delete guild map',
      details: (error as Error).message
    }, { status: 500 })
  }
})
