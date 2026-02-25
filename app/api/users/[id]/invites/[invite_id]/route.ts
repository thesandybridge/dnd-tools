import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuildInvite } from "@/lib/serializers"

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, invite_id } = await params
    const userId = id as string
    const inviteId = parseInt(invite_id as string, 10)

    if (session.user.id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    if (isNaN(inviteId)) {
      return Response.json({ error: "Invalid invite ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    if (status !== "accepted" && status !== "declined") {
      return Response.json({ error: "Status must be 'accepted' or 'declined'" }, { status: 400 })
    }

    if (status === "accepted") {
      const result = await prisma.$transaction(async (tx) => {
        const invite = await tx.guildInvite.findUnique({
          where: { id: inviteId },
        })
        if (!invite || invite.targetUserId !== userId) {
          return { error: "Invite not found", status: 404 } as const
        }
        if (invite.status !== "pending") {
          return { error: "Invite is no longer pending", status: 409 } as const
        }
        if (invite.expiresAt < new Date()) {
          await tx.guildInvite.update({
            where: { id: inviteId },
            data: { status: "expired" },
          })
          return { error: "Invite has expired", status: 410 } as const
        }

        const guild = await tx.guild.findUnique({ where: { guildId: invite.guildId } })
        let roleId = guild!.defaultRoleId

        if (!roleId) {
          const lowestRole = await tx.guildRole.findFirst({
            where: { guildId: invite.guildId },
            orderBy: { position: "desc" },
          })
          if (!lowestRole) {
            return { error: "No roles configured for this guild", status: 500 } as const
          }
          roleId = lowestRole.id
        }

        await tx.guildMember.create({
          data: { guildId: invite.guildId, userId, roleId },
        })

        const updated = await tx.guildInvite.update({
          where: { id: inviteId },
          data: { status: "accepted" },
          include: {
            guild: { select: { guildId: true, name: true } },
            invitedBy: { select: { id: true, name: true } },
          },
        })

        return { data: updated } as const
      })

      if ("error" in result) {
        return Response.json({ error: result.error }, { status: result.status })
      }
      return Response.json(serializeGuildInvite(result.data))
    }

    // Decline path
    const invite = await prisma.guildInvite.findUnique({
      where: { id: inviteId },
    })
    if (!invite || invite.targetUserId !== userId) {
      return Response.json({ error: "Invite not found" }, { status: 404 })
    }
    if (invite.status !== "pending") {
      return Response.json({ error: "Invite is no longer pending" }, { status: 409 })
    }

    const updated = await prisma.guildInvite.update({
      where: { id: inviteId },
      data: { status: "declined" },
      include: {
        guild: { select: { guildId: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
      },
    })

    return Response.json(serializeGuildInvite(updated))
  } catch (error) {
    console.error("Failed to respond to invite:", (error as Error).message)
    return Response.json({ error: "Failed to respond to invite" }, { status: 500 })
  }
})
