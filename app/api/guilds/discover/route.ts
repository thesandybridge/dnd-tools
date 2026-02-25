import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const rawPage = parseInt(url.searchParams.get("page") || "1", 10)
    const page = (!isNaN(rawPage) && rawPage >= 1) ? Math.min(rawPage, 1000) : 1
    const limit = 12

    const where = {
      visibility: "public",
      members: { none: { userId: session.user.id! } },
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [guilds, total] = await Promise.all([
      prisma.guild.findMany({
        where,
        include: {
          ownerUser: { select: { name: true } },
          _count: { select: { members: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { members: { _count: "desc" } },
      }),
      prisma.guild.count({ where }),
    ])

    const pendingRequests = await prisma.joinRequest.findMany({
      where: {
        userId: session.user.id!,
        guildId: { in: guilds.map(g => g.guildId) },
        status: "pending",
      },
      select: { guildId: true },
    })
    const pendingSet = new Set(pendingRequests.map(r => r.guildId))

    return Response.json({
      guilds: guilds.map(g => ({
        id: g.id,
        guild_id: g.guildId,
        name: g.name,
        description: g.description,
        owner: { name: g.ownerUser.name },
        member_count: g._count.members,
        has_pending_request: pendingSet.has(g.guildId),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch discover guilds:", (error as Error).message)
    return Response.json({ error: "Failed to fetch guilds" }, { status: 500 })
  }
})
