import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id } = await params
    const limit = 20

    // Verify membership
    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: 'Not a member' }, { status: 403 })
    }

    // Get all map IDs for this guild
    const guildMaps = await prisma.guildMap.findMany({
      where: { guildId: guild_id },
      select: { mapId: true, name: true, createdAt: true },
    })
    const mapIds = guildMaps.map((m) => m.mapId)

    const [members, markers] = await Promise.all([
      prisma.guildMember.findMany({
        where: { guildId: guild_id },
        include: { user: { select: { name: true } } },
        orderBy: { joinedAt: 'desc' },
        take: limit,
      }),
      prisma.marker.findMany({
        where: { guildMapId: { in: mapIds } },
        include: {
          user: { select: { name: true } },
          guildMap: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    const events: { type: string; date: string; data: Record<string, unknown> }[] = []

    for (const m of members) {
      events.push({
        type: 'member_join',
        date: m.joinedAt.toISOString(),
        data: { user_name: m.user.name },
      })
    }

    for (const map of guildMaps) {
      events.push({
        type: 'map_create',
        date: map.createdAt.toISOString(),
        data: { map_name: map.name },
      })
    }

    for (const m of markers) {
      events.push({
        type: 'marker_place',
        date: m.createdAt.toISOString(),
        data: {
          user_name: m.user.name,
          text: m.text,
          map_name: m.guildMap.name,
        },
      })
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return Response.json(events.slice(0, limit))
  } catch (error) {
    console.error('Failed to fetch guild activity:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch guild activity' }, { status: 500 })
  }
})
