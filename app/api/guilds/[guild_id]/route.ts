import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, isGuildOwner } from "@/lib/permissions"
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

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_guild')) {
      return Response.json({ error: 'You do not have permission to update this guild' }, { status: 403 })
    }

    const { guildData } = await request.json()

    const allowedFields = ['name', 'description', 'visibility', 'defaultRoleId', 'requestExpiryDays']
    const sanitized: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in guildData) sanitized[key] = guildData[key]
    }

    if ('defaultRoleId' in sanitized && sanitized.defaultRoleId != null) {
      const role = await prisma.guildRole.findFirst({
        where: { id: sanitized.defaultRoleId as number, guildId: guild_id as string },
      })
      if (!role) {
        return Response.json({ error: 'Role not found in this guild' }, { status: 422 })
      }
    }

    const guild = await prisma.guild.update({
      where: { guildId: guild_id as string },
      data: sanitized,
    })

    return Response.json(serializeGuild(guild))
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

    if (!await isGuildOwner(guild_id as string, session.user.id!)) {
      return Response.json({ error: 'Only the guild owner can delete this guild' }, { status: 403 })
    }

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
