import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, outranks } from "@/lib/permissions"
import { serializeRole } from "@/lib/serializers"

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, role_id } = await params

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_guild')) {
      return Response.json({ error: 'You do not have permission to edit roles' }, { status: 403 })
    }

    const targetRole = await prisma.guildRole.findUnique({
      where: { id: parseInt(role_id as string, 10) },
    })

    if (!targetRole || targetRole.guildId !== (guild_id as string)) {
      return Response.json({ error: 'Role not found' }, { status: 404 })
    }

    // Can't edit the system owner role (position 0)
    if (targetRole.position === 0) {
      return Response.json({ error: 'Cannot edit the owner role' }, { status: 403 })
    }

    // Actor must outrank the target role
    const actor = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: session.user.id!,
        },
      },
      include: { role: true },
    })

    if (actor && !outranks(actor.role.position, targetRole.position)) {
      return Response.json({ error: 'You cannot edit a role equal to or higher than your own' }, { status: 403 })
    }

    const { name, color, manage_members, manage_maps, manage_markers, manage_guild } = await request.json()

    // If name is changing, check uniqueness
    if (name !== undefined && name.trim() !== targetRole.name) {
      const existing = await prisma.guildRole.findUnique({
        where: { guildId_name: { guildId: guild_id as string, name: name.trim() } },
      })
      if (existing) {
        return Response.json({ error: 'A role with this name already exists' }, { status: 409 })
      }
    }

    const role = await prisma.guildRole.update({
      where: { id: targetRole.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(manage_members !== undefined && { manageMembers: manage_members }),
        ...(manage_maps !== undefined && { manageMaps: manage_maps }),
        ...(manage_markers !== undefined && { manageMarkers: manage_markers }),
        ...(manage_guild !== undefined && { manageGuild: manage_guild }),
      },
    })

    return Response.json(serializeRole(role))
  } catch (error) {
    console.error('Failed to update role:', (error as Error).message)
    return Response.json({
      error: 'Failed to update role',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, role_id } = await params

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_guild')) {
      return Response.json({ error: 'You do not have permission to delete roles' }, { status: 403 })
    }

    const targetRole = await prisma.guildRole.findUnique({
      where: { id: parseInt(role_id as string, 10) },
    })

    if (!targetRole || targetRole.guildId !== (guild_id as string)) {
      return Response.json({ error: 'Role not found' }, { status: 404 })
    }

    // Can't delete system roles
    if (targetRole.isSystem) {
      return Response.json({ error: 'Cannot delete system roles' }, { status: 403 })
    }

    // Actor must outrank the target role
    const actor = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: session.user.id!,
        },
      },
      include: { role: true },
    })

    if (actor && !outranks(actor.role.position, targetRole.position)) {
      return Response.json({ error: 'You cannot delete a role equal to or higher than your own' }, { status: 403 })
    }

    // Find the highest-position (lowest-rank) role to reassign members to
    const fallbackRole = await prisma.guildRole.findFirst({
      where: {
        guildId: guild_id as string,
        id: { not: targetRole.id },
      },
      orderBy: { position: 'desc' },
    })

    if (!fallbackRole) {
      return Response.json({ error: 'Cannot delete the last role' }, { status: 400 })
    }

    await prisma.$transaction([
      // Reassign all members of this role to the fallback role
      prisma.guildMember.updateMany({
        where: {
          guildId: guild_id as string,
          roleId: targetRole.id,
        },
        data: { roleId: fallbackRole.id },
      }),
      // Delete the role
      prisma.guildRole.delete({
        where: { id: targetRole.id },
      }),
    ])

    return Response.json(null)
  } catch (error) {
    console.error('Failed to delete role:', (error as Error).message)
    return Response.json({
      error: 'Failed to delete role',
      details: (error as Error).message
    }, { status: 500 })
  }
})
