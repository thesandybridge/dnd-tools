import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { serializeGuildInvite } from "@/lib/serializers"

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params
    const guildId = guild_id as string
    const inviterId = session.user.id!

    if (!(await hasPermission(guildId, inviterId, "manage_members"))) {
      return Response.json({ error: "You do not have permission to invite members" }, { status: 403 })
    }

    const body = await request.json()
    const { targetUserId, message } = body

    if (!targetUserId || typeof targetUserId !== "string") {
      return Response.json({ error: "targetUserId is required" }, { status: 400 })
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already a member
    const existingMember = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId: targetUserId } },
    })
    if (existingMember) {
      return Response.json({ error: "User is already a member of this guild" }, { status: 409 })
    }

    // Check for existing pending invite
    const existingInvite = await prisma.guildInvite.findUnique({
      where: { guildId_targetUserId: { guildId, targetUserId } },
    })
    if (existingInvite && existingInvite.status === "pending") {
      if (existingInvite.expiresAt < new Date()) {
        await prisma.guildInvite.update({
          where: { id: existingInvite.id },
          data: { status: "expired" },
        })
      } else {
        return Response.json({ error: "An invite is already pending for this user" }, { status: 409 })
      }
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invite = await prisma.guildInvite.upsert({
      where: { guildId_targetUserId: { guildId, targetUserId } },
      update: {
        invitedById: inviterId,
        message: message || null,
        status: "pending",
        expiresAt,
      },
      create: {
        guildId,
        targetUserId,
        invitedById: inviterId,
        message: message || null,
        expiresAt,
      },
      include: {
        guild: { select: { guildId: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
      },
    })

    return Response.json(serializeGuildInvite(invite))
  } catch (error) {
    console.error("Failed to create invite:", (error as Error).message)
    return Response.json({ error: "Failed to create invite" }, { status: 500 })
  }
})
