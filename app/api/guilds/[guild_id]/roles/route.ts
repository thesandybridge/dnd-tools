import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { serializeRole } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params

    const roles = await prisma.guildRole.findMany({
      where: { guildId: guild_id as string },
      orderBy: { position: 'asc' },
    })

    return Response.json(roles.map(serializeRole))
  } catch (error) {
    console.error('Failed to fetch roles:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch roles',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params

    if (!await hasPermission(guild_id as string, session.user.id!, 'manage_guild')) {
      return Response.json({ error: 'You do not have permission to create roles' }, { status: 403 })
    }

    const roleCount = await prisma.guildRole.count({
      where: { guildId: guild_id as string },
    })

    if (roleCount >= 10) {
      return Response.json({ error: 'Maximum of 10 roles per guild' }, { status: 400 })
    }

    const { name, color, manage_members, manage_maps, manage_markers, manage_guild } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Check name uniqueness
    const existing = await prisma.guildRole.findUnique({
      where: { guildId_name: { guildId: guild_id as string, name: name.trim() } },
    })

    if (existing) {
      return Response.json({ error: 'A role with this name already exists' }, { status: 409 })
    }

    // Auto-assign position to highest + 1
    const highestRole = await prisma.guildRole.findFirst({
      where: { guildId: guild_id as string },
      orderBy: { position: 'desc' },
    })

    const position = highestRole ? highestRole.position + 1 : 0

    const role = await prisma.guildRole.create({
      data: {
        guildId: guild_id as string,
        name: name.trim(),
        color: color || "#6b7280",
        position,
        manageMembers: manage_members ?? false,
        manageMaps: manage_maps ?? false,
        manageMarkers: manage_markers ?? false,
        manageGuild: manage_guild ?? false,
        isSystem: false,
      },
    })

    return Response.json(serializeRole(role), { status: 201 })
  } catch (error) {
    console.error('Failed to create role:', (error as Error).message)
    return Response.json({
      error: 'Failed to create role',
      details: (error as Error).message
    }, { status: 500 })
  }
})
