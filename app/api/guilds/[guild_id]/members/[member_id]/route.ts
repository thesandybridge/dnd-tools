import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeMemberBasic } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id, member_id } = await params

    const member = await prisma.guildMember.findUniqueOrThrow({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: member_id as string,
        },
      },
    })

    return Response.json(serializeMemberBasic(member))
  } catch (error) {
    return Response.json({
      error: 'Failed to fetch member data',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id, member_id } = await params
    const { role } = await request.json()

    const currentUser = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: session.user.id!,
        },
      },
    })

    if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
      return Response.json({
        error: 'You are not authorized to update this member'
      }, { status: 403 })
    }

    await prisma.guildMember.update({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: member_id as string,
        },
      },
      data: { role },
    })

    return Response.json(null)
  } catch (error) {
    return Response.json({
      error: 'Failed to update member role',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id, member_id } = await params

    const member = await prisma.guildMember.findUniqueOrThrow({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: member_id as string,
        },
      },
    })

    if (member.role === 'owner') {
      // Deleting the owner deletes the entire guild (members cascade)
      await prisma.guild.delete({
        where: { guildId: guild_id as string },
      })

      return Response.json({ redirect: true })
    }

    await prisma.guildMember.delete({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: member_id as string,
        },
      },
    })

    return Response.json({ redirect: false })
  } catch (error) {
    console.error('Failed to remove member or delete guild:', (error as Error).message)
    return Response.json({
      error: 'Failed to remove member or delete guild',
      details: (error as Error).message
    }, { status: 500 })
  }
})
