import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params

    const memberships = await prisma.guildMember.findMany({
      where: { userId: id },
      include: {
        guild: {
          include: {
            _count: { select: { members: true } },
          },
        },
        role: true,
      },
    })

    const result = memberships.map((m) => ({
      guild_id: m.guild.guildId,
      name: m.guild.name,
      owner: m.guild.ownerId,
      is_owner: m.guild.ownerId === id,
      member_count: m.guild._count.members,
      role: {
        id: m.role.id,
        name: m.role.name,
        color: m.role.color,
        position: m.role.position,
      },
    }))

    return Response.json(result)
  } catch (error) {
    console.error('Failed to fetch user guilds:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch user guilds' }, { status: 500 })
  }
})
