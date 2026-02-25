import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
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

    if (map.visibility === 'dm_only') {
      if (!await hasPermission(guild_id as string, session.user.id!, 'manage_maps')) {
        return Response.json({ error: "You do not have permission to view this map" }, { status: 403 })
      }
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

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_maps')) {
      return Response.json({ error: "You do not have permission to update maps" }, { status: 403 })
    }

    const { name, pmtilesUrl, pmtilesApiKey, useTileForgeKey, imageWidth, imageHeight, maxZoom, defaultZoom, defaultCenterLat, defaultCenterLng, visibility } = await request.json()

    let resolvedApiKey = pmtilesApiKey
    if (useTileForgeKey && !pmtilesApiKey) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id! },
        select: { tileforgeApiKey: true },
      })
      resolvedApiKey = user?.tileforgeApiKey || undefined
    }

    const map = await prisma.guildMap.update({
      where: { mapId: map_id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(pmtilesUrl !== undefined && { pmtilesUrl }),
        ...(resolvedApiKey !== undefined && { pmtilesApiKey: resolvedApiKey }),
        ...(imageWidth !== undefined && { imageWidth }),
        ...(imageHeight !== undefined && { imageHeight }),
        ...(maxZoom !== undefined && { maxZoom }),
        ...(defaultZoom !== undefined && { defaultZoom }),
        ...(defaultCenterLat !== undefined && { defaultCenterLat }),
        ...(defaultCenterLng !== undefined && { defaultCenterLng }),
        ...(visibility !== undefined && { visibility }),
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

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_maps')) {
      return Response.json({ error: "You do not have permission to delete maps" }, { status: 403 })
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
