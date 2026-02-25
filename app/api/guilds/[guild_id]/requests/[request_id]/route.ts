import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { serializeJoinRequest } from "@/lib/serializers"

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, request_id } = await params
    const guildId = guild_id as string
    const requestId = parseInt(request_id as string, 10)

    if (isNaN(requestId)) {
      return Response.json({ error: "Invalid request ID" }, { status: 400 })
    }

    if (!await hasPermission(guildId, session.user.id!, "manage_members")) {
      return Response.json({ error: "You do not have permission to review join requests" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (status !== "approved" && status !== "denied") {
      return Response.json({ error: "Status must be 'approved' or 'denied'" }, { status: 400 })
    }

    const reviewData = {
      status,
      reviewedBy: session.user.id!,
      reviewedAt: new Date(),
    }

    if (status === "approved") {
      const result = await prisma.$transaction(async (tx) => {
        const joinRequest = await tx.joinRequest.findUnique({
          where: { id: requestId },
        })
        if (!joinRequest || joinRequest.guildId !== guildId) {
          return { error: "Join request not found", status: 404 } as const
        }
        if (joinRequest.status !== "pending") {
          return { error: "Join request is no longer pending", status: 409 } as const
        }

        const guild = await tx.guild.findUnique({ where: { guildId } })
        let roleId = guild!.defaultRoleId

        if (!roleId) {
          const lowestRole = await tx.guildRole.findFirst({
            where: { guildId },
            orderBy: { position: "desc" },
          })
          if (!lowestRole) {
            return { error: "No roles configured for this guild", status: 500 } as const
          }
          roleId = lowestRole.id
        }

        await tx.guildMember.create({
          data: { guildId, userId: joinRequest.userId, roleId },
        })

        const updated = await tx.joinRequest.update({
          where: { id: requestId },
          data: reviewData,
          include: { user: { select: { id: true, name: true, image: true } } },
        })

        return { data: updated } as const
      })

      if ("error" in result) {
        return Response.json({ error: result.error }, { status: result.status })
      }
      return Response.json(serializeJoinRequest(result.data))
    }

    // Denied
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    })
    if (!joinRequest || joinRequest.guildId !== guildId) {
      return Response.json({ error: "Join request not found" }, { status: 404 })
    }
    if (joinRequest.status !== "pending") {
      return Response.json({ error: "Join request is no longer pending" }, { status: 409 })
    }

    const updated = await prisma.joinRequest.update({
      where: { id: requestId },
      data: reviewData,
      include: { user: { select: { id: true, name: true, image: true } } },
    })

    return Response.json(serializeJoinRequest(updated))
  } catch (error) {
    console.error("Failed to review join request:", (error as Error).message)
    return Response.json({ error: "Failed to review join request", details: (error as Error).message }, { status: 500 })
  }
})
