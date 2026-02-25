import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { user_id } = await params
    const targetUserId = user_id as string
    const currentUserId = session.user.id!

    // Get guilds where current user is owner or has manage_members role
    const managedMemberships = await prisma.guildMember.findMany({
      where: {
        userId: currentUserId,
        role: { manageMembers: true },
      },
      select: { guildId: true },
    })

    const ownedGuilds = await prisma.guild.findMany({
      where: { ownerId: currentUserId },
      select: { guildId: true },
    })

    const managedGuildIds = [
      ...new Set([
        ...managedMemberships.map((m) => m.guildId),
        ...ownedGuilds.map((g) => g.guildId),
      ]),
    ]

    if (managedGuildIds.length === 0) {
      return Response.json([])
    }

    // Filter out guilds where target is already a member
    const existingMemberships = await prisma.guildMember.findMany({
      where: {
        userId: targetUserId,
        guildId: { in: managedGuildIds },
      },
      select: { guildId: true },
    })
    const memberGuildIds = new Set(existingMemberships.map((m) => m.guildId))

    // Filter out guilds with pending invites for this user
    const pendingInvites = await prisma.guildInvite.findMany({
      where: {
        targetUserId,
        guildId: { in: managedGuildIds },
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      select: { guildId: true },
    })
    const pendingGuildIds = new Set(pendingInvites.map((i) => i.guildId))

    const availableGuildIds = managedGuildIds.filter(
      (id) => !memberGuildIds.has(id) && !pendingGuildIds.has(id)
    )

    if (availableGuildIds.length === 0) {
      return Response.json([])
    }

    const guilds = await prisma.guild.findMany({
      where: { guildId: { in: availableGuildIds } },
      select: { guildId: true, name: true },
      orderBy: { name: "asc" },
    })

    return Response.json(guilds.map((g) => ({ guild_id: g.guildId, name: g.name })))
  } catch (error) {
    console.error("Failed to fetch invitable guilds:", (error as Error).message)
    return Response.json({ error: "Failed to fetch invitable guilds" }, { status: 500 })
  }
})
