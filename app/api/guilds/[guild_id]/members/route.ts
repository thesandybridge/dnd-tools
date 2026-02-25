import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { serializeMember, serializeMemberBasic } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id } = await params
    const guildId = guild_id as string
    const userId = session.user.id!

    // Check membership
    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId } },
    })
    if (!member) {
      // Also allow guild owner who may not be in the members table
      const guild = await prisma.guild.findUnique({ where: { guildId }, select: { ownerId: true } })
      if (!guild || guild.ownerId !== userId) {
        return Response.json({ error: 'Not a member of this guild' }, { status: 403 })
      }
    }

    const members = await prisma.guildMember.findMany({
      where: { guildId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: true,
      },
    })

    return Response.json(members.map(serializeMember))
  } catch (error) {
    console.error('Failed to fetch members:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch members',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id } = await params
    const { memberId, roleId } = await request.json()

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_members')) {
      return Response.json({
        error: 'Unauthorized to add members'
      }, { status: 403 })
    }

    let assignedRoleId = roleId
    if (!assignedRoleId) {
      const lowestRole = await prisma.guildRole.findFirst({
        where: { guildId: guild_id as string },
        orderBy: { position: 'desc' },
      })
      if (!lowestRole) {
        return Response.json({ error: 'No roles found for this guild' }, { status: 500 })
      }
      assignedRoleId = lowestRole.id
    }

    const member = await prisma.guildMember.create({
      data: {
        guildId: guild_id as string,
        userId: memberId,
        roleId: assignedRoleId,
      },
      include: {
        role: true,
      },
    })

    return Response.json(serializeMemberBasic(member), { status: 201 })
  } catch (error) {
    console.error('Failed to add member:', (error as Error).message)
    return Response.json({
      error: 'Failed to add member',
      details: (error as Error).message
    }, { status: 500 })
  }
})
