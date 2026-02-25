import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const userId = session.user.id!
    const limit = 20

    const [memberships, characters, markers] = await Promise.all([
      prisma.guildMember.findMany({
        where: { userId },
        include: { guild: { select: { name: true, guildId: true } } },
        orderBy: { joinedAt: 'desc' },
        take: limit,
      }),
      prisma.character.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.marker.findMany({
        where: { userId },
        include: { guildMap: { select: { name: true, guildId: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    const events: { type: string; date: string; data: Record<string, unknown> }[] = []

    for (const m of memberships) {
      events.push({
        type: 'guild_join',
        date: m.joinedAt.toISOString(),
        data: { guild_name: m.guild.name, guild_id: m.guild.guildId },
      })
    }

    for (const c of characters) {
      events.push({
        type: 'character_create',
        date: c.createdAt.toISOString(),
        data: { name: c.name, id: c.id, char_class: c.charClass, level: c.level },
      })
    }

    for (const m of markers) {
      events.push({
        type: 'marker_place',
        date: m.createdAt.toISOString(),
        data: {
          text: m.text,
          map_name: m.guildMap.name,
          guild_id: m.guildMap.guildId,
        },
      })
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return Response.json(events.slice(0, limit))
  } catch (error) {
    console.error('Failed to fetch activity:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
})
