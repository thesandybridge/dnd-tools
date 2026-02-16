import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuild, serializeGuildWithOwner } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guild_id } = await params

    const guild = await prisma.guild.findUniqueOrThrow({
      where: { guildId: guild_id as string },
      include: { ownerUser: { select: { name: true } } },
    })

    return Response.json(serializeGuildWithOwner(guild))
  } catch (error) {
    console.error('Failed to fetch guild data:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch guild data',
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
    const { guild_id } = await params
    const { guildData } = await request.json()

    const guild = await prisma.guild.update({
      where: { guildId: guild_id as string },
      data: { ...guildData },
    })

    return Response.json([serializeGuild(guild)])
  } catch (error) {
    console.error('Failed to update guild:', (error as Error).message)
    return Response.json({
      error: 'Failed to update guild',
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
    const { guild_id } = await params

    await prisma.guild.delete({
      where: { guildId: guild_id as string },
    })

    return Response.json(null)
  } catch (error) {
    console.error('Failed to delete guild:', (error as Error).message)
    return Response.json({
      error: 'Failed to delete guild',
      details: (error as Error).message
    }, { status: 500 })
  }
})
