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
    const { guild_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id as string, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const canManageMaps = await hasPermission(guild_id as string, session.user.id!, 'manage_maps')

    const maps = await prisma.guildMap.findMany({
      where: {
        guildId: guild_id as string,
        ...(!canManageMaps ? { visibility: { not: 'dm_only' } } : {}),
      },
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

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_maps')) {
      return Response.json({ error: "You do not have permission to create maps" }, { status: 403 })
    }

    const { name, pmtilesUrl, pmtilesApiKey, useTileForgeKey, imageWidth, imageHeight, maxZoom, visibility } = await request.json()

    let resolvedApiKey = pmtilesApiKey
    if (useTileForgeKey && !pmtilesApiKey) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id! },
        select: { tileforgeApiKey: true },
      })
      resolvedApiKey = user?.tileforgeApiKey || undefined
    }

    const map = await prisma.guildMap.create({
      data: {
        guildId: guild_id as string,
        name,
        pmtilesUrl,
        ...(resolvedApiKey !== undefined && { pmtilesApiKey: resolvedApiKey }),
        ...(imageWidth !== undefined && { imageWidth }),
        ...(imageHeight !== undefined && { imageHeight }),
        ...(maxZoom !== undefined && { maxZoom }),
        ...(visibility !== undefined && { visibility }),
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
