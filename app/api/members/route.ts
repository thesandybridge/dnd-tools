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
    const page = !isNaN(rawPage) && rawPage >= 1 ? Math.min(rawPage, 1000) : 1
    const limit = 12

    const where = {
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          color: true,
          guildMembers: {
            select: {
              guild: {
                select: {
                  guildId: true,
                  name: true,
                  visibility: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ])

    return Response.json({
      members: users.map((u) => ({
        id: u.id,
        name: u.name,
        image: u.image,
        color: u.color,
        guilds: u.guildMembers
          .filter((gm) => gm.guild.visibility === "public")
          .map((gm) => ({ guild_id: gm.guild.guildId, name: gm.guild.name })),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch members:", (error as Error).message)
    return Response.json({ error: "Failed to fetch members" }, { status: 500 })
  }
})
