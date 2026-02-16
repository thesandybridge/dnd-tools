import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeMember } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id } = await params

    const members = await prisma.guildMember.findMany({
      where: { guildId: guild_id as string },
      include: {
        user: { select: { id: true, name: true, email: true } },
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
    const { memberId, role } = await request.json()

    const currentUser = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: session.user.id!,
        },
      },
    })

    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
      return Response.json({
        error: 'Unauthorized to add members'
      }, { status: 403 })
    }

    const data = await prisma.guildMember.create({
      data: {
        guildId: guild_id as string,
        userId: memberId,
        role: role || 'member',
      },
    })

    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('Failed to add member:', (error as Error).message)
    return Response.json({
      error: 'Failed to add member',
      details: (error as Error).message
    }, { status: 500 })
  }
})
