import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, isGuildOwner, outranks } from "@/lib/permissions"
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
      include: { role: true },
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
    const { roleId } = await request.json()

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_members')) {
      return Response.json({
        error: 'You are not authorized to update this member'
      }, { status: 403 })
    }

    // Can't change the owner's role
    if (await isGuildOwner(guild_id as string, member_id as string)) {
      return Response.json({
        error: "Cannot change the guild owner's role"
      }, { status: 403 })
    }

    // Get actor's role position
    const actor = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: session.user.id!,
        },
      },
      include: { role: true },
    })

    if (!actor) {
      return Response.json({ error: 'Actor not found' }, { status: 403 })
    }

    // Get target member's current role position
    const target = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: member_id as string,
        },
      },
      include: { role: true },
    })

    if (!target) {
      return Response.json({ error: 'Target member not found' }, { status: 404 })
    }

    // Actor must outrank target
    if (!outranks(actor.role.position, target.role.position)) {
      return Response.json({
        error: 'You cannot modify a member with equal or higher rank'
      }, { status: 403 })
    }

    // Get the new role and check actor outranks it
    const newRole = await prisma.guildRole.findUnique({
      where: { id: roleId },
    })

    if (!newRole || newRole.guildId !== (guild_id as string)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (!outranks(actor.role.position, newRole.position)) {
      return Response.json({
        error: 'You cannot assign a role equal to or higher than your own'
      }, { status: 403 })
    }

    await prisma.guildMember.update({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: member_id as string,
        },
      },
      data: { roleId },
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

    // Check if target is the guild owner
    if (await isGuildOwner(guild_id as string, member_id as string)) {
      // Deleting the owner deletes the entire guild (members cascade)
      await prisma.guild.delete({
        where: { guildId: guild_id as string },
      })

      return Response.json({ redirect: true })
    }

    // For non-owner removals, check permission and hierarchy
    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_members')) {
      // Allow self-removal
      if (session.user.id! !== (member_id as string)) {
        return Response.json({
          error: 'You are not authorized to remove this member'
        }, { status: 403 })
      }
    } else if (session.user.id! !== (member_id as string)) {
      // If removing someone else, actor must outrank target
      const actor = await prisma.guildMember.findUnique({
        where: {
          guildId_userId: {
            guildId: guild_id as string,
            userId: session.user.id!,
          },
        },
        include: { role: true },
      })

      const target = await prisma.guildMember.findUnique({
        where: {
          guildId_userId: {
            guildId: guild_id as string,
            userId: member_id as string,
          },
        },
        include: { role: true },
      })

      if (!actor || !target) {
        return Response.json({ error: 'Member not found' }, { status: 404 })
      }

      if (!outranks(actor.role.position, target.role.position)) {
        return Response.json({
          error: 'You cannot remove a member with equal or higher rank'
        }, { status: 403 })
      }
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
